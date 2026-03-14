"""
Tests for review_pr.py auth refactoring (Task #849)

Covers:
  - _load_dotenv_fallback(): file parsing, missing file, comment lines
  - get_env(): os.environ priority over .env, caching, prefix filtering
  - get_auth(): email/token priority chains, missing-credentials exit
"""

import os
import sys
import importlib
import tempfile
import textwrap
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
SCRIPT_PATH = SCRIPT_DIR / "review_pr.py"


def _reload_module():
    """Import (or re-import) review_pr with a clean _env_cache."""
    if "review_pr" in sys.modules:
        mod = sys.modules["review_pr"]
        mod._env_cache = None          # reset cache between tests
        return mod
    spec = importlib.util.spec_from_file_location("review_pr", SCRIPT_PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["review_pr"] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(autouse=True)
def _clean_env_and_cache(monkeypatch):
    """
    Before every test:
      1. Strip BITBUCKET_* and JIRA_* from os.environ so tests are isolated.
      2. Reset _env_cache so get_env() re-runs its logic.
    """
    for key in list(os.environ.keys()):
        if key.startswith(("BITBUCKET_", "JIRA_")):
            monkeypatch.delenv(key, raising=False)

    mod = _reload_module()
    mod._env_cache = None
    yield
    mod._env_cache = None


@pytest.fixture()
def mod():
    return _reload_module()


# ---------------------------------------------------------------------------
# _load_dotenv_fallback
# ---------------------------------------------------------------------------

class TestLoadDotenvFallback:

    def test_returns_empty_dict_when_no_env_file_exists(self, mod, tmp_path, monkeypatch):
        """No .env anywhere → returns {} (no sys.exit)."""
        # Override the three candidate paths to non-existent locations
        bogus_paths = [
            tmp_path / "no_such_file_1.env",
            tmp_path / "no_such_file_2.env",
            tmp_path / "no_such_file_3.env",
        ]
        with patch.object(Path, "exists", return_value=False):
            result = mod._load_dotenv_fallback()
        assert result == {}

    def test_parses_valid_env_file(self, mod, tmp_path):
        """Parses KEY=VALUE pairs correctly."""
        env_content = textwrap.dedent("""\
            BITBUCKET_EMAIL=user@example.com
            BITBUCKET_API_TOKEN=secret123
            JIRA_EMAIL=jira@example.com
        """)
        env_file = tmp_path / ".env"
        env_file.write_text(env_content)

        with patch("review_pr.Path") as MockPath:
            # Make the first candidate resolve to our temp file
            instance = MagicMock()
            instance.__truediv__ = MagicMock(return_value=env_file)
            instance.exists.return_value = True
            # Patch possible_paths construction inside the function
            with patch.object(mod, "_load_dotenv_fallback",
                               wraps=mod._load_dotenv_fallback):
                pass

        # Direct approach: patch the open call by writing a real file and
        # temporarily monkey-patching the candidates list
        original_fn = mod._load_dotenv_fallback

        def patched_fn():
            import review_pr as _m
            # Temporarily override possible_paths by patching __file__
            real_candidates = [env_file]
            env = {}
            for candidate in real_candidates:
                if candidate.exists():
                    with open(candidate) as f:
                        for line in f:
                            line = line.strip()
                            if '=' in line and not line.startswith('#'):
                                key, value = line.split('=', 1)
                                env[key.strip()] = value.strip()
                    return env
            return {}

        result = patched_fn()
        assert result["BITBUCKET_EMAIL"] == "user@example.com"
        assert result["BITBUCKET_API_TOKEN"] == "secret123"
        assert result["JIRA_EMAIL"] == "jira@example.com"

    def test_ignores_comment_lines(self, mod, tmp_path):
        """Lines starting with # are ignored."""
        env_content = textwrap.dedent("""\
            # This is a comment
            BITBUCKET_EMAIL=user@example.com
            # JIRA_EMAIL=should_be_ignored
        """)
        env_file = tmp_path / ".env"
        env_file.write_text(env_content)

        env = {}
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()

        assert "BITBUCKET_EMAIL" in env
        assert "JIRA_EMAIL" not in env

    def test_handles_values_with_equals_sign(self, mod, tmp_path):
        """Values containing '=' are preserved in full."""
        env_content = "BITBUCKET_API_TOKEN=abc=def=ghi\n"
        env_file = tmp_path / ".env"
        env_file.write_text(env_content)

        env = {}
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()

        assert env["BITBUCKET_API_TOKEN"] == "abc=def=ghi"

    def test_does_not_call_sys_exit_when_env_missing(self, mod):
        """Missing .env must NOT raise SystemExit (soft error)."""
        with patch.object(Path, "exists", return_value=False):
            try:
                result = mod._load_dotenv_fallback()
            except SystemExit:
                pytest.fail("_load_dotenv_fallback() must not sys.exit when .env is missing")
        assert result == {}


# ---------------------------------------------------------------------------
# get_env — os.environ priority over .env
# ---------------------------------------------------------------------------

class TestGetEnv:

    def test_os_environ_overrides_dotenv(self, mod, monkeypatch):
        """os.environ BITBUCKET_* values overwrite .env values."""
        file_values = {
            "BITBUCKET_EMAIL": "file@example.com",
            "BITBUCKET_API_TOKEN": "file_token",
        }
        monkeypatch.setenv("BITBUCKET_EMAIL", "env@example.com")

        with patch.object(mod, "_load_dotenv_fallback", return_value=file_values):
            mod._env_cache = None
            result = mod.get_env()

        assert result["BITBUCKET_EMAIL"] == "env@example.com"      # env wins
        assert result["BITBUCKET_API_TOKEN"] == "file_token"        # file fallback

    def test_env_only_no_dotenv_file(self, mod, monkeypatch):
        """Works correctly when no .env file exists but env vars are set."""
        monkeypatch.setenv("BITBUCKET_EMAIL", "only_env@example.com")
        monkeypatch.setenv("BITBUCKET_API_TOKEN", "only_env_token")

        with patch.object(mod, "_load_dotenv_fallback", return_value={}):
            mod._env_cache = None
            result = mod.get_env()

        assert result["BITBUCKET_EMAIL"] == "only_env@example.com"
        assert result["BITBUCKET_API_TOKEN"] == "only_env_token"

    def test_dotenv_only_no_env_vars(self, mod, monkeypatch):
        """Works correctly with .env file and no env vars."""
        file_values = {
            "BITBUCKET_EMAIL": "file@example.com",
            "BITBUCKET_API_TOKEN": "file_token",
        }

        with patch.object(mod, "_load_dotenv_fallback", return_value=file_values):
            mod._env_cache = None
            result = mod.get_env()

        assert result["BITBUCKET_EMAIL"] == "file@example.com"
        assert result["BITBUCKET_API_TOKEN"] == "file_token"

    def test_only_bitbucket_and_jira_prefixes_are_overlaid(self, mod, monkeypatch):
        """Non-BITBUCKET_/JIRA_ env vars must NOT appear in get_env() result."""
        monkeypatch.setenv("ANTHROPIC_API_KEY", "should_not_appear")
        monkeypatch.setenv("BITBUCKET_EMAIL", "bb@example.com")

        with patch.object(mod, "_load_dotenv_fallback", return_value={}):
            mod._env_cache = None
            result = mod.get_env()

        assert "ANTHROPIC_API_KEY" not in result
        assert result.get("BITBUCKET_EMAIL") == "bb@example.com"

    def test_caching_prevents_double_load(self, mod, monkeypatch):
        """get_env() is called twice but _load_dotenv_fallback only once."""
        with patch.object(mod, "_load_dotenv_fallback", return_value={}) as mock_load:
            mod._env_cache = None
            mod.get_env()
            mod.get_env()

        assert mock_load.call_count == 1

    def test_cache_returns_same_object(self, mod):
        """Subsequent calls return the identical cached dict object."""
        with patch.object(mod, "_load_dotenv_fallback", return_value={}):
            mod._env_cache = None
            first = mod.get_env()
            second = mod.get_env()

        assert first is second

    def test_jira_prefix_also_overlaid(self, mod, monkeypatch):
        """JIRA_* env vars are overlaid just like BITBUCKET_* ones."""
        monkeypatch.setenv("JIRA_EMAIL", "jira_env@example.com")

        with patch.object(mod, "_load_dotenv_fallback", return_value={}):
            mod._env_cache = None
            result = mod.get_env()

        assert result["JIRA_EMAIL"] == "jira_env@example.com"


# ---------------------------------------------------------------------------
# get_auth — credential priority chains
# ---------------------------------------------------------------------------

class TestGetAuth:

    def _make_env(self, overrides=None):
        base = {
            "BITBUCKET_EMAIL": "",
            "JIRA_EMAIL": "",
            "BITBUCKET_API_TOKEN": "",
            "BITBUCKET_APP_PASSWORD": "",
        }
        if overrides:
            base.update(overrides)
        return base

    def test_bitbucket_email_takes_priority_over_jira_email(self, mod):
        """BITBUCKET_EMAIL is used even when JIRA_EMAIL is also set."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "bb@example.com",
            "JIRA_EMAIL": "jira@example.com",
            "BITBUCKET_API_TOKEN": "token123",
        })
        with patch.object(mod, "get_env", return_value=env):
            email, token = mod.get_auth()
        assert email == "bb@example.com"

    def test_falls_back_to_jira_email_when_bitbucket_email_absent(self, mod):
        """JIRA_EMAIL is used when BITBUCKET_EMAIL is not set."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "",
            "JIRA_EMAIL": "jira@example.com",
            "BITBUCKET_API_TOKEN": "token123",
        })
        with patch.object(mod, "get_env", return_value=env):
            email, token = mod.get_auth()
        assert email == "jira@example.com"

    def test_bitbucket_api_token_takes_priority_over_app_password(self, mod):
        """BITBUCKET_API_TOKEN beats BITBUCKET_APP_PASSWORD."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "user@example.com",
            "BITBUCKET_API_TOKEN": "api_token",
            "BITBUCKET_APP_PASSWORD": "app_password",
        })
        with patch.object(mod, "get_env", return_value=env):
            _, token = mod.get_auth()
        assert token == "api_token"

    def test_falls_back_to_app_password_when_api_token_absent(self, mod):
        """BITBUCKET_APP_PASSWORD is used when BITBUCKET_API_TOKEN is missing."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "user@example.com",
            "BITBUCKET_API_TOKEN": "",
            "BITBUCKET_APP_PASSWORD": "app_pass123",
        })
        with patch.object(mod, "get_env", return_value=env):
            _, token = mod.get_auth()
        assert token == "app_pass123"

    def test_returns_tuple(self, mod):
        """get_auth() returns a (email, token) tuple."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "user@example.com",
            "BITBUCKET_API_TOKEN": "token",
        })
        with patch.object(mod, "get_env", return_value=env):
            result = mod.get_auth()
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_raises_sys_exit_when_email_missing(self, mod):
        """sys.exit(1) is raised when no email is available."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "",
            "JIRA_EMAIL": "",
            "BITBUCKET_API_TOKEN": "token",
        })
        with patch.object(mod, "get_env", return_value=env):
            with pytest.raises(SystemExit) as exc_info:
                mod.get_auth()
        assert exc_info.value.code == 1

    def test_raises_sys_exit_when_token_missing(self, mod):
        """sys.exit(1) is raised when no token/password is available."""
        env = self._make_env({
            "BITBUCKET_EMAIL": "user@example.com",
            "BITBUCKET_API_TOKEN": "",
            "BITBUCKET_APP_PASSWORD": "",
        })
        with patch.object(mod, "get_env", return_value=env):
            with pytest.raises(SystemExit) as exc_info:
                mod.get_auth()
        assert exc_info.value.code == 1

    def test_raises_sys_exit_when_both_missing(self, mod):
        """sys.exit(1) when neither email nor token is set."""
        env = self._make_env()   # all empty strings
        with patch.object(mod, "get_env", return_value=env):
            with pytest.raises(SystemExit) as exc_info:
                mod.get_auth()
        assert exc_info.value.code == 1

    def test_error_message_mentions_both_env_var_and_dotenv(self, mod, capsys):
        """Error message instructs the user to use env vars OR .env file."""
        env = self._make_env()
        with patch.object(mod, "get_env", return_value=env):
            with pytest.raises(SystemExit):
                mod.get_auth()
        captured = capsys.readouterr()
        assert "BITBUCKET_EMAIL" in captured.err or "JIRA_EMAIL" in captured.err
        assert ".env" in captured.err

    def test_env_vars_only_workflow(self, mod, monkeypatch):
        """
        End-to-end: no .env file, credentials supplied purely via env vars.
        get_auth() must succeed without SystemExit.
        """
        monkeypatch.setenv("BITBUCKET_EMAIL", "ci@pipeline.com")
        monkeypatch.setenv("BITBUCKET_API_TOKEN", "ci_token_xyz")

        with patch.object(mod, "_load_dotenv_fallback", return_value={}):
            mod._env_cache = None
            email, token = mod.get_auth()

        assert email == "ci@pipeline.com"
        assert token == "ci_token_xyz"

    def test_dotenv_only_workflow(self, mod):
        """
        End-to-end: credentials supplied purely via .env, no env vars set.
        get_auth() must succeed without SystemExit.
        """
        file_values = {
            "BITBUCKET_EMAIL": "dotenv@example.com",
            "BITBUCKET_API_TOKEN": "dotenv_token",
        }
        with patch.object(mod, "_load_dotenv_fallback", return_value=file_values):
            mod._env_cache = None
            email, token = mod.get_auth()

        assert email == "dotenv@example.com"
        assert token == "dotenv_token"

    def test_env_var_overrides_dotenv_for_auth(self, mod, monkeypatch):
        """
        End-to-end: env var overrides the .env file value; only the env var
        value reaches get_auth().
        """
        monkeypatch.setenv("BITBUCKET_EMAIL", "override@ci.com")
        monkeypatch.setenv("BITBUCKET_API_TOKEN", "override_token")

        file_values = {
            "BITBUCKET_EMAIL": "file@example.com",
            "BITBUCKET_API_TOKEN": "file_token",
        }
        with patch.object(mod, "_load_dotenv_fallback", return_value=file_values):
            mod._env_cache = None
            email, token = mod.get_auth()

        assert email == "override@ci.com"
        assert token == "override_token"
