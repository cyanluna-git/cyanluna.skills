"""
autotag.py — DB 전처리: 모든 태스크 타이틀 기반 자동 태깅
Usage: python3 scripts/autotag.py [--dry-run] [--project <id>]
"""

import re
import json
import subprocess
import sys
import time
from typing import Optional

BASE_URL = "https://cyanlunakanban.vercel.app"
AUTH_TOKEN = "2+pg9CUzHgjjKDXxWNpMuRpnVPTTAZ5T042F+nwLz5M="

ALL_PROJECTS = [
    "edwards.oqc.infra",
    "edwards.operation.board",
    "testrig-dashboard",
    "unify",
    "ai-cycling-coach",
    "ai.cycling.workout.planner",
    "assist.11th",
    "asan.bicycle",
    "assist-hub",
    "cpet",
    "today.bike",
    "unahouse.finance",
    "assist.ai.mba",
    "cyanluna-portfolio",
    "cyanluna.skills",
    "kanban-board",
]

# ─── Keyword → Tag Map ──────────────────────────────────────────────────────
# Pattern: (regex, tag)  — first match wins per group
# Tags are intentionally specific (tech name) not generic (category) so that
# the graph shows WHICH technology connects nodes, not just "frontend/backend".
RULES: list[tuple[re.Pattern[str], str]] = [r[0] for r in [
    # ── Frontend frameworks ──
    (re.compile(r"\bnext\.?js\b|nextjs", re.I),         "nextjs"),
    (re.compile(r"\breact[\s\-]query|tanstack", re.I),   "react-query"),
    (re.compile(r"\breact\b", re.I),                     "react"),
    (re.compile(r"\bvite\b", re.I),                      "vite"),
    (re.compile(r"\bzustand\b", re.I),                   "zustand"),
    (re.compile(r"\bredux\b", re.I),                     "redux"),
    (re.compile(r"\bhotwire|turbo|stimulus\b", re.I),    "hotwire"),
    (re.compile(r"\bshadcn|radix\b", re.I),              "shadcn"),
    (re.compile(r"\btailwind\b", re.I),                  "tailwind"),
    (re.compile(r"\btypescript|\bts\b", re.I),           "typescript"),

    # ── Backend frameworks ──
    (re.compile(r"\bfastapi\b", re.I),                   "fastapi"),
    (re.compile(r"\brails|ruby on rails\b", re.I),       "rails"),
    (re.compile(r"\bdjango\b", re.I),                    "django"),
    (re.compile(r"\bnode\.?js|express\b", re.I),         "nodejs"),
    (re.compile(r"\bpython\b", re.I),                    "python"),
    (re.compile(r"\bruby\b", re.I),                      "ruby"),

    # ── Database ──
    (re.compile(r"\bneon\b", re.I),                      "neon"),
    (re.compile(r"\bsupabase\b", re.I),                  "supabase"),
    (re.compile(r"\btimescaledb\b", re.I),               "timescaledb"),
    (re.compile(r"\binfluxdb\b", re.I),                  "influxdb"),
    (re.compile(r"\bpostgresql|postgres\b", re.I),       "postgresql"),
    (re.compile(r"\bsqlite\b", re.I),                    "sqlite"),
    (re.compile(r"\bmysql\b", re.I),                     "mysql"),
    (re.compile(r"\bdrizzle\b", re.I),                   "drizzle"),
    (re.compile(r"\bprisma\b", re.I),                    "prisma"),
    (re.compile(r"\bsqlalchemy\b", re.I),                "sqlalchemy"),
    (re.compile(r"\boracle\b", re.I),                    "oracle"),

    # ── Auth ──
    (re.compile(r"\bauth\.?js\b", re.I),                 "auth.js"),
    (re.compile(r"\boauth|jwt|saml|sso\b", re.I),        "oauth"),
    (re.compile(r"\b인증|devise|session\b", re.I),        "auth"),
    (re.compile(r"\bauth(?:entication|orization)?\b", re.I), "auth"),

    # ── DevOps / Deploy ──
    (re.compile(r"\bdocker[\s\-]?compose\b", re.I),      "docker-compose"),
    (re.compile(r"\bdocker\b", re.I),                    "docker"),
    (re.compile(r"\bvercel\b", re.I),                    "vercel"),
    (re.compile(r"\bkamal\b", re.I),                     "kamal"),
    (re.compile(r"\bgcp|google cloud\b", re.I),          "gcp"),
    (re.compile(r"\bazure\b", re.I),                     "azure"),
    (re.compile(r"\bci[/\-]cd|github actions\b", re.I), "ci-cd"),
    (re.compile(r"\b배포|deploy(?:ment)?\b", re.I),       "deploy"),
    (re.compile(r"\bnginx\b", re.I),                     "nginx"),
    (re.compile(r"\bcloud[\s\-]?run\b", re.I),           "gcp"),

    # ── Mobile / PWA ──
    (re.compile(r"\bcapacitor\b", re.I),                 "capacitor"),
    (re.compile(r"\bpwa\b", re.I),                       "pwa"),
    (re.compile(r"\bios|android|react[\s\-]?native\b", re.I), "mobile"),
    (re.compile(r"\b모바일\b"),                            "mobile"),

    # ── API / Integration ──
    (re.compile(r"\bmodbus\b", re.I),                    "modbus"),
    (re.compile(r"\bwebsocket|sse|server[\s\-]?sent\b", re.I), "realtime"),
    (re.compile(r"\b실시간|realtime\b", re.I),             "realtime"),
    (re.compile(r"\bwebhook\b", re.I),                   "webhook"),
    (re.compile(r"\brest(?:ful)?[\s\-]?api|graphql\b", re.I), "api"),
    (re.compile(r"\bapi\b", re.I),                       "api"),
    (re.compile(r"\bendpoint\b", re.I),                  "api"),

    # ── UI / Visualization ──
    (re.compile(r"\bforce[\s\-]?graph|d3\b", re.I),      "graph"),
    (re.compile(r"\brecharts|chart\.?js\b", re.I),       "chart"),
    (re.compile(r"\b시각화|visualization|chart|graph\b", re.I), "visualization"),
    (re.compile(r"\bdashboard|대시보드\b", re.I),           "dashboard"),
    (re.compile(r"\bmodal|overlay|drawer|sheet\b", re.I), "modal"),
    (re.compile(r"\bcanvas\b", re.I),                    "canvas"),
    (re.compile(r"\bkakao[\s\-]?map|지도|map\b", re.I),  "maps"),
    (re.compile(r"\bgpx|geojson|gps\b", re.I),           "gps"),

    # ── AI / ML ──
    (re.compile(r"\bllm|gpt|claude|gemini|groq|openai|anthropic\b", re.I), "ai"),
    (re.compile(r"\bml|머신[\s\-]?러닝|machine[\s\-]?learning\b", re.I), "ai"),
    (re.compile(r"\bai\b", re.I),                        "ai"),

    # ── Testing ──
    (re.compile(r"\bplaywright|vitest|jest|cucumber|pytest|behave\b", re.I), "testing"),
    (re.compile(r"\bbdd|tdd\b", re.I),                   "testing"),
    (re.compile(r"\btest(?:ing)?\b|테스트\b", re.I),      "testing"),

    # ── Storage / Files ──
    (re.compile(r"\bcloudflare[\s\-]?r2|r2\b", re.I),   "r2"),
    (re.compile(r"\bs3\b|aws[\s\-]?s3\b", re.I),        "s3"),
    (re.compile(r"\bstorage|저장|upload|업로드\b", re.I), "storage"),
    (re.compile(r"\bpdf\b", re.I),                       "pdf"),
    (re.compile(r"\bdocx|excel|xlsx\b", re.I),           "excel"),

    # ── Performance ──
    (re.compile(r"\bperformance|성능|optimize|최적화\b", re.I), "performance"),
    (re.compile(r"\bcache|caching|캐시\b", re.I),         "cache"),

    # ── Infra / Architecture ──
    (re.compile(r"\bmigration|마이그레이션\b", re.I),      "migration"),
    (re.compile(r"\bsubmodule\b", re.I),                 "submodule"),
    (re.compile(r"\bmonorepo\b", re.I),                  "monorepo"),
    (re.compile(r"\brefactor|리팩터|리팩토링\b", re.I),    "refactor"),
    (re.compile(r"\bscaffold|scaffold\b", re.I),         "scaffold"),

    # ── Project-specific ──
    (re.compile(r"\bkanban\b", re.I),                    "kanban"),
    (re.compile(r"\bjavis\b", re.I),                     "javis"),
    (re.compile(r"\bobsidian\b", re.I),                  "obsidian"),
    (re.compile(r"\bintervals\.icu|zwift|zwo\b", re.I), "cycling-data"),
    (re.compile(r"\bctl|atl|tsb|ftp\b", re.I),          "cycling-data"),
    (re.compile(r"\bmodbus|plc\b", re.I),                "plc"),
    (re.compile(r"\beuv|abatement|vacuum\b", re.I),      "euv"),
]]

# Wrap as (pattern, tag) tuples for iteration
RULES_WITH_TAGS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bnext\.?js\b|nextjs", re.I),         "nextjs"),
    (re.compile(r"\breact[\s\-]query|tanstack", re.I),   "react-query"),
    (re.compile(r"\breact\b", re.I),                     "react"),
    (re.compile(r"\bvite\b", re.I),                      "vite"),
    (re.compile(r"\bzustand\b", re.I),                   "zustand"),
    (re.compile(r"\bredux\b", re.I),                     "redux"),
    (re.compile(r"\bhotwire|turbo|stimulus\b", re.I),    "hotwire"),
    (re.compile(r"\bshadcn|radix\b", re.I),              "shadcn"),
    (re.compile(r"\btailwind\b", re.I),                  "tailwind"),
    (re.compile(r"\btypescript\b", re.I),                "typescript"),
    (re.compile(r"\bfastapi\b", re.I),                   "fastapi"),
    (re.compile(r"\brails|ruby on rails\b", re.I),       "rails"),
    (re.compile(r"\bdjango\b", re.I),                    "django"),
    (re.compile(r"\bnode\.?js|express\b", re.I),         "nodejs"),
    (re.compile(r"\bpython\b", re.I),                    "python"),
    (re.compile(r"\bruby\b", re.I),                      "ruby"),
    (re.compile(r"\bneon\b", re.I),                      "neon"),
    (re.compile(r"\bsupabase\b", re.I),                  "supabase"),
    (re.compile(r"\btimescaledb\b", re.I),               "timescaledb"),
    (re.compile(r"\binfluxdb\b", re.I),                  "influxdb"),
    (re.compile(r"\bpostgresql|postgres\b", re.I),       "postgresql"),
    (re.compile(r"\bsqlite\b", re.I),                    "sqlite"),
    (re.compile(r"\bmysql\b", re.I),                     "mysql"),
    (re.compile(r"\bdrizzle\b", re.I),                   "drizzle"),
    (re.compile(r"\bprisma\b", re.I),                    "prisma"),
    (re.compile(r"\bsqlalchemy\b", re.I),                "sqlalchemy"),
    (re.compile(r"\boracle\b", re.I),                    "oracle"),
    (re.compile(r"\bauth\.?js\b", re.I),                 "auth.js"),
    (re.compile(r"\boauth|jwt|saml|sso\b", re.I),        "oauth"),
    (re.compile(r"\b인증|devise\b"),                      "auth"),
    (re.compile(r"\bauth(?:entication|orization)?\b", re.I), "auth"),
    (re.compile(r"\bdocker[\s\-]?compose\b", re.I),      "docker-compose"),
    (re.compile(r"\bdocker\b", re.I),                    "docker"),
    (re.compile(r"\bvercel\b", re.I),                    "vercel"),
    (re.compile(r"\bkamal\b", re.I),                     "kamal"),
    (re.compile(r"\bgcp|google[\s\-]cloud|cloud[\s\-]run\b", re.I), "gcp"),
    (re.compile(r"\bazure\b", re.I),                     "azure"),
    (re.compile(r"\bci[/\-]cd|github[\s\-]actions\b", re.I), "ci-cd"),
    (re.compile(r"\b배포|deploy(?:ment)?\b", re.I),       "deploy"),
    (re.compile(r"\bnginx\b", re.I),                     "nginx"),
    (re.compile(r"\bcapacitor\b", re.I),                 "capacitor"),
    (re.compile(r"\bpwa\b", re.I),                       "pwa"),
    (re.compile(r"\bios|android|react[\s\-]?native\b", re.I), "mobile"),
    (re.compile(r"\b모바일\b"),                            "mobile"),
    (re.compile(r"\bmodbus\b", re.I),                    "modbus"),
    (re.compile(r"\bwebsocket|sse|server[\s\-]?sent\b", re.I), "realtime"),
    (re.compile(r"\b실시간|realtime\b", re.I),             "realtime"),
    (re.compile(r"\bwebhook\b", re.I),                   "webhook"),
    (re.compile(r"\brest(?:ful)?[\s\-]?api|graphql\b", re.I), "api"),
    (re.compile(r"\bapi\b", re.I),                       "api"),
    (re.compile(r"\bendpoint\b", re.I),                  "api"),
    (re.compile(r"\bforce[\s\-]?graph|d3\b", re.I),      "graph"),
    (re.compile(r"\brecharts|chart\.?js\b", re.I),       "chart"),
    (re.compile(r"\b시각화|visualization\b", re.I),        "visualization"),
    (re.compile(r"\bdashboard|대시보드\b", re.I),           "dashboard"),
    (re.compile(r"\bmodal|overlay|drawer|sheet\b", re.I), "modal"),
    (re.compile(r"\bcanvas\b", re.I),                    "canvas"),
    (re.compile(r"\bkakao[\s\-]?map|지도\b", re.I),       "maps"),
    (re.compile(r"\bgpx|geojson|gps\b", re.I),           "gps"),
    (re.compile(r"\bllm|gpt|claude|gemini|groq|openai|anthropic\b", re.I), "ai"),
    (re.compile(r"\bml|머신[\s\-]?러닝|machine[\s\-]?learning\b", re.I), "ai"),
    (re.compile(r"\bai\b", re.I),                        "ai"),
    (re.compile(r"\bplaywright|vitest|jest|cucumber|pytest|behave\b", re.I), "testing"),
    (re.compile(r"\bbdd|tdd\b", re.I),                   "testing"),
    (re.compile(r"\btest(?:ing)?\b|테스트\b", re.I),      "testing"),
    (re.compile(r"\bcloudflare[\s\-]?r2\b", re.I),       "r2"),
    (re.compile(r"\bs3\b|aws[\s\-]?s3\b", re.I),        "s3"),
    (re.compile(r"\bstorage|업로드|upload\b", re.I),      "storage"),
    (re.compile(r"\bpdf\b", re.I),                       "pdf"),
    (re.compile(r"\bdocx|excel|xlsx\b", re.I),           "excel"),
    (re.compile(r"\bperformance|성능|optimize|최적화\b", re.I), "performance"),
    (re.compile(r"\bcache|caching|캐시\b", re.I),         "cache"),
    (re.compile(r"\bmigration|마이그레이션\b", re.I),      "migration"),
    (re.compile(r"\bsubmodule\b", re.I),                 "submodule"),
    (re.compile(r"\bmonorepo\b", re.I),                  "monorepo"),
    (re.compile(r"\brefactor|리팩터|리팩토링\b", re.I),    "refactor"),
    (re.compile(r"\bkanban\b", re.I),                    "kanban"),
    (re.compile(r"\bjavis\b", re.I),                     "javis"),
    (re.compile(r"\bobsidian\b", re.I),                  "obsidian"),
    (re.compile(r"\bintervals\.icu|zwift|zwo\b", re.I), "cycling-data"),
    (re.compile(r"\bctl|atl|tsb\b"),                     "cycling-data"),
    (re.compile(r"\bplc\b", re.I),                       "plc"),
    (re.compile(r"\beuv|abatement|vacuum[\s\-]pump\b", re.I), "euv"),
    (re.compile(r"\bhostlink\b", re.I),                  "hostlink"),
    (re.compile(r"\bboostrap\.sh|bootstrap\b", re.I),    "infra"),
    (re.compile(r"\bsymlink\b", re.I),                   "infra"),
    (re.compile(r"\bscaffold\b", re.I),                  "scaffold"),
    (re.compile(r"\bschema\b", re.I),                    "schema"),
    (re.compile(r"\bmock\b", re.I),                      "mock"),
    (re.compile(r"\bcss|styled[\s\-]components|emotion\b", re.I), "css"),
    (re.compile(r"\bnpm|pnpm|yarn|bun\b", re.I),         "package-manager"),
]


def extract_topics(title: str) -> list[str]:
    """Extract tech/topic tags from a task title."""
    found: list[str] = []
    seen: set[str] = set()
    for pattern, tag in RULES_WITH_TAGS:
        if tag not in seen and pattern.search(title):
            found.append(tag)
            seen.add(tag)
    return found


def api(method: str, path: str, body: Optional[dict] = None) -> dict:
    cmd = ["curl", "-s", "-H", f"X-Kanban-Auth: {AUTH_TOKEN}",
           "-X", method, f"{BASE_URL}{path}"]
    if body:
        cmd += ["-H", "Content-Type: application/json",
                "--data-binary", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout else {}


def fetch_all_tasks(project: str) -> list[dict]:
    d = api("GET", f"/api/board?project={project}&summary=true")
    tasks = []
    for col in ["todo", "plan", "plan_review", "impl", "impl_review", "test", "done"]:
        tasks.extend(d.get(col, []))
    return tasks


def parse_tags(tags_raw: Optional[str]) -> list[str]:
    if not tags_raw or tags_raw == "null":
        return []
    try:
        parsed = json.loads(tags_raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def run(dry_run: bool = False, only_project: Optional[str] = None) -> None:
    projects = [only_project] if only_project else ALL_PROJECTS
    total_updated = 0
    total_tasks = 0
    tag_freq: dict[str, int] = {}

    for proj in projects:
        tasks = fetch_all_tasks(proj)
        if not tasks:
            continue

        proj_updated = 0
        for task in tasks:
            total_tasks += 1
            tid = task["id"]
            title = task.get("title", "")
            existing = parse_tags(task.get("tags"))
            existing_lower = {t.lower() for t in existing}

            auto = extract_topics(title)
            new_tags = [t for t in auto if t.lower() not in existing_lower]

            if not new_tags:
                continue

            merged = existing + new_tags
            for t in new_tags:
                tag_freq[t] = tag_freq.get(t, 0) + 1

            if dry_run:
                print(f"  [{proj}] #{tid} {title[:55]}")
                print(f"    + {new_tags}")
                continue

            result = api("PATCH", f"/api/task/{tid}?project={proj}",
                         {"tags": json.dumps(merged)})
            if result.get("success"):
                proj_updated += 1
                total_updated += 1
            else:
                print(f"  WARN #{tid}: {result}")

            time.sleep(0.05)  # 50ms throttle — ~20 req/s

        if not dry_run:
            print(f"  [{proj}] {proj_updated}/{len(tasks)} tasks updated")

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Done: {total_updated}/{total_tasks} tasks tagged")
    if tag_freq:
        sorted_freq = sorted(tag_freq.items(), key=lambda x: -x[1])
        print("\nTop auto-tags added:")
        for tag, count in sorted_freq[:20]:
            print(f"  {tag:20s} +{count}")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    project_arg = None
    if "--project" in sys.argv:
        idx = sys.argv.index("--project")
        project_arg = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None

    run(dry_run=dry_run, only_project=project_arg)
