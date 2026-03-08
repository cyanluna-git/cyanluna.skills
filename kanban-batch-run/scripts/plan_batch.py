#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


PHASE_RE = re.compile(r"(?:^|,)\s*phase:(\d+)\s*(?:,|$)")


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


def task_sort_key(task: dict, input_order: dict[int, int]):
    phase = parse_phase(task.get("tags"))
    return (
        phase if phase is not None else 10_000,
        input_order[int(task["id"])],
    )


def build_groups(tasks: list[dict]) -> list[dict]:
    groups: list[dict] = []

    for task in tasks:
      phase = parse_phase(task.get("tags"))
      if not groups:
          groups.append(
              {
                  "mode": "sequential",
                  "phase": phase,
                  "task_ids": [task["id"]],
              }
          )
          continue

      last = groups[-1]
      if phase is not None and last["phase"] == phase:
          # Same-phase tasks are only candidates. The orchestrator still validates
          # independence before running in parallel.
          last["task_ids"].append(task["id"])
          continue

      groups.append(
          {
              "mode": "sequential",
              "phase": phase,
              "task_ids": [task["id"]],
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
    tasks = [fetch_task(args.base_url, args.project, task_id) for task_id in task_ids]
    ordered = sorted(tasks, key=lambda task: task_sort_key(task, input_order))

    payload = {
        "project": args.project,
        "task_ids": task_ids,
        "ordered_tasks": [
            {
                "id": task["id"],
                "title": task.get("title"),
                "status": task.get("status"),
                "priority": task.get("priority"),
                "level": task.get("level"),
                "phase": parse_phase(task.get("tags")),
                "tags": task.get("tags"),
            }
            for task in ordered
        ],
        "candidate_groups": build_groups(ordered),
    }

    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
