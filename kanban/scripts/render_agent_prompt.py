#!/usr/bin/env python3
import argparse
import json
import os
import pathlib
import re
import sys


MODEL_KEYS = {
    "MODEL_REFINER": "refiner",
    "MODEL_PLANNER": "planner",
    "MODEL_CRITIC": "critic",
    "MODEL_BUILDER": "builder",
    "MODEL_SHIELD": "shield",
    "MODEL_INSPECTOR": "inspector",
    "MODEL_RANGER": "ranger",
}

EFFORT_KEYS = {
    "EFFORT_REFINER": "refiner",
    "EFFORT_PLANNER": "planner",
    "EFFORT_CRITIC": "critic",
    "EFFORT_BUILDER": "builder",
    "EFFORT_SHIELD": "shield",
    "EFFORT_INSPECTOR": "inspector",
    "EFFORT_RANGER": "ranger",
}


def parse_set(values):
    result = {}
    for item in values:
        if "=" not in item:
            raise ValueError(f"--set must be KEY=VALUE, got: {item}")
        k, v = item.split("=", 1)
        result[k] = v
    return result


def resolve_provider(cli_provider):
    if cli_provider:
        return cli_provider
    env_provider = os.getenv("KANBAN_MODEL_PROVIDER", "")
    if env_provider:
        return env_provider
    if os.getenv("CODEX_THREAD_ID") or os.getenv("CODEX_CI"):
        return "codex"
    if os.getenv("CLAUDE_PROJECT_DIR") or os.getenv("CLAUDECODE"):
        return "claude"
    if pathlib.Path(".claude").is_dir():
        return "claude"
    if pathlib.Path(".codex").is_dir():
        return "codex"
    return ""


def main():
    parser = argparse.ArgumentParser(
        description="Render kanban agent template with model/provider placeholder resolution."
    )
    parser.add_argument("--template", required=True, help="Template markdown path")
    parser.add_argument(
        "--models",
        default="../kanban/models.json",
        help="Path to models.json (default: ../kanban/models.json)",
    )
    parser.add_argument(
        "--provider", choices=["claude", "codex"], help="Model provider override"
    )
    parser.add_argument(
        "--set",
        action="append",
        default=[],
        help="Placeholder replacement as KEY=VALUE (repeatable)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail if unresolved <PLACEHOLDER> remains",
    )
    parser.add_argument(
        "--ignore",
        action="append",
        default=[],
        help="Placeholder name to ignore for --strict (repeatable)",
    )
    args = parser.parse_args()

    template_path = pathlib.Path(args.template)
    models_path = pathlib.Path(args.models)

    if not template_path.exists():
        print(f"template not found: {template_path}", file=sys.stderr)
        return 1
    if not models_path.exists():
        print(f"models file not found: {models_path}", file=sys.stderr)
        return 1

    with models_path.open() as f:
        model_cfg = json.load(f)

    provider = resolve_provider(args.provider) or model_cfg.get("default_provider", "claude")
    providers = model_cfg.get("providers", {})
    if provider not in providers:
        print(f"unknown provider: {provider}", file=sys.stderr)
        return 1

    replacements = {}
    for ph, key in MODEL_KEYS.items():
        replacements[ph] = providers[provider][key]
    effort_cfg = model_cfg.get("reasoning_effort", {}).get(provider, {})
    for ph, key in EFFORT_KEYS.items():
        replacements[ph] = effort_cfg.get(key, "")
    replacements.update(parse_set(args.set))

    content = template_path.read_text()
    for k, v in replacements.items():
        content = content.replace(f"<{k}>", v)

    unresolved = sorted(
        set(re.findall(r"<([A-Za-z0-9_]+)>", content)) - set(args.ignore)
    )
    if args.strict and unresolved:
        print("unresolved placeholders: " + ", ".join(unresolved), file=sys.stderr)
        return 2

    sys.stdout.write(content)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
