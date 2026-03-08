#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


PHASE_RE = re.compile(r"(?:^|,)\s*phase:(\d+)\s*(?:,|$)")
DEPENDS_RE = re.compile(r"(?im)^depends on:\s*(.+)$")
PARALLEL_RE = re.compile(r"(?im)^parallel-safe:\s*(.+)$")
TOUCHES_RE = re.compile(r"(?im)^touches:\s*(.+)$")

GENERIC_TAG_PREFIXES = ("phase:", "explore-", "sprint")
GENERIC_TAGS = {"ui", "feature", "maintenance", "data", "ux"}
HOTSPOT_HINTS = {
    "app/",
    "route",
    "routes",
    "navigation",
    "header",
    "layout",
    "shell",
    "loader",
    "types",
    "schema",
    "migration",
    "api",
}


def expand_selector(raw: str) -> list[int]:
    parts = [part.strip() for part in re.split(r"[\s,]+", raw) if part.strip()]
    ids: list[int] = []
    seen: set[int] = set()

    for part in parts:
        if "-" in part:
            start_raw, end_raw = part.split("-", 1)
            start = int(start_raw)
            end = int(end_raw)
            step = 1 if end >= start else -1
            for value in range(start, end + step, step):
                if value not in seen:
                    seen.add(value)
                    ids.append(value)
            continue

        value = int(part)
        if value not in seen:
            seen.add(value)
            ids.append(value)

    return ids


def fetch_task(base_url: str, project: str, task_id: int) -> dict:
    url = f"{base_url}/api/task/{task_id}?project={urllib.parse.quote(project)}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"failed to fetch task {task_id}: HTTP {exc.code}") from exc


def parse_phase(tags: str | None) -> int | None:
    if not tags:
        return None
    match = PHASE_RE.search(tags)
    if not match:
        return None
    return int(match.group(1))


def parse_depends_on(description: str | None) -> list[int]:
    if not description:
        return []

    match = DEPENDS_RE.search(description)
    if not match:
        return []

    ids = []
    for raw_value in re.findall(r"#?(\d+)", match.group(1)):
        ids.append(int(raw_value))
    return ids


def parse_parallel_safe(description: str | None) -> bool | None:
    if not description:
        return None

    match = PARALLEL_RE.search(description)
    if not match:
        return None

    normalized = match.group(1).strip().lower()
    if normalized in {"yes", "true", "y", "safe"}:
        return True
    if normalized in {"no", "false", "n", "unsafe"}:
        return False
    return None


def parse_touches(description: str | None) -> list[str]:
    if not description:
        return []

    match = TOUCHES_RE.search(description)
    if not match:
        return []

    return [
        token.strip().lower()
        for token in match.group(1).split(",")
        if token.strip()
    ]


def extract_tag_modules(tags: str | None) -> list[str]:
    if not tags:
        return []

    modules: list[str] = []
    for token in tags.split(","):
        normalized = token.strip().lower()
        if not normalized:
            continue
        if normalized in GENERIC_TAGS:
            continue
        if normalized.startswith(GENERIC_TAG_PREFIXES):
            continue
        modules.append(normalized)
    return modules


def infer_task(task: dict) -> dict:
    description = task.get("description") or ""
    phase = parse_phase(task.get("tags"))
    touches = parse_touches(description)
    tag_modules = extract_tag_modules(task.get("tags"))
    modules = sorted(set(touches + tag_modules))

    return {
        "id": int(task["id"]),
        "title": task.get("title"),
        "status": task.get("status"),
        "priority": task.get("priority"),
        "level": task.get("level"),
        "phase": phase,
        "tags": task.get("tags"),
        "depends_on": parse_depends_on(description),
        "parallel_safe": parse_parallel_safe(description),
        "module_hints": modules,
    }


def task_sort_key(task: dict, input_order: dict[int, int]):
    phase = task.get("phase")
    return (
        phase if phase is not None else 10_000,
        input_order[int(task["id"])],
    )


def has_hotspot_overlap(group_tasks: list[dict], candidate: dict) -> bool:
    candidate_hints = set(candidate.get("module_hints") or [])
    for hint in candidate_hints:
        if any(hotspot in hint for hotspot in HOTSPOT_HINTS):
            return True

    for task in group_tasks:
        for hint in task.get("module_hints") or []:
            if any(hotspot in hint for hotspot in HOTSPOT_HINTS):
                return True

    return False


def can_parallelize_with_group(group_tasks: list[dict], candidate: dict) -> tuple[bool, str]:
    if candidate.get("status") != "todo":
        return False, f"task #{candidate['id']} is not in todo"

    if candidate.get("parallel_safe") is False:
        return False, f"task #{candidate['id']} explicitly says Parallel-safe: no"

    group_ids = {task["id"] for task in group_tasks}
    if any(dep in group_ids for dep in candidate.get("depends_on") or []):
        return False, f"task #{candidate['id']} depends on another task in the group"

    for task in group_tasks:
        if task.get("status") != "todo":
            return False, f"task #{task['id']} is not in todo"
        if task.get("parallel_safe") is False:
            return False, f"task #{task['id']} explicitly says Parallel-safe: no"
        if candidate["id"] in (task.get("depends_on") or []):
            return False, f"task #{task['id']} depends on task #{candidate['id']}"

    if has_hotspot_overlap(group_tasks, candidate):
        return False, "shared hotspot modules make the boundary unsafe"

    candidate_modules = set(candidate.get("module_hints") or [])
    group_modules = {
        hint
        for task in group_tasks
        for hint in (task.get("module_hints") or [])
    }

    if candidate.get("parallel_safe") is True and all(
        task.get("parallel_safe") is True for task in group_tasks
    ):
        return True, "explicit Parallel-safe: yes on all tasks and no dependency edges"

    if candidate_modules and group_modules and candidate_modules.isdisjoint(group_modules):
        return True, "same phase, no dependency edges, distinct module hints"

    return False, "module boundaries are shared or unclear"


def build_groups(tasks: list[dict]) -> list[dict]:
    groups: list[dict] = []

    for task in tasks:
        if not groups:
            groups.append(
                {
                    "mode": "sequential",
                    "phase": task.get("phase"),
                    "task_ids": [task["id"]],
                    "reason": "first task in ordered batch",
                }
            )
            continue

        last_group = groups[-1]
        last_phase = last_group.get("phase")
        current_phase = task.get("phase")

        if current_phase != last_phase:
            reason = (
                f"phase {current_phase} follows phase {last_phase}"
                if current_phase is not None and last_phase is not None
                else "phase boundary changed or missing"
            )
            groups.append(
                {
                    "mode": "sequential",
                    "phase": current_phase,
                    "task_ids": [task["id"]],
                    "reason": reason,
                }
            )
            continue

        group_tasks = [existing for existing in tasks if existing["id"] in last_group["task_ids"]]
        can_parallelize, reason = can_parallelize_with_group(group_tasks, task)
        if can_parallelize:
            last_group["mode"] = "parallel_candidate"
            last_group["task_ids"].append(task["id"])
            last_group["reason"] = reason
            continue

        groups.append(
            {
                "mode": "sequential",
                "phase": current_phase,
                "task_ids": [task["id"]],
                "reason": reason,
            }
        )

    return groups


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--tasks", required=True, help="e.g. 500-504 or 500,501,504")
    parser.add_argument("--base-url", default="http://localhost:5173")
    args = parser.parse_args()

    task_ids = expand_selector(args.tasks)
    if not task_ids:
        raise SystemExit("no task ids resolved")

    input_order = {task_id: index for index, task_id in enumerate(task_ids)}
    raw_tasks = [fetch_task(args.base_url, args.project, task_id) for task_id in task_ids]
    tasks = [infer_task(task) for task in raw_tasks]
    ordered = sorted(tasks, key=lambda task: task_sort_key(task, input_order))

    payload = {
        "project": args.project,
        "task_ids": task_ids,
        "ordered_tasks": ordered,
        "candidate_groups": build_groups(ordered),
    }

    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
