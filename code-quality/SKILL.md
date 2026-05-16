---
name: code-quality
description: "Run code coverage, mutation testing (Stryker), CRAP score analysis, and dead code detection in one shot. Usage: /code-quality [file globs...] [--test <test glob>] [--skip-mutation] [--skip-dead-code]"
argument-hint: "[src/lib/foo.ts ...] [--test src/__tests__/foo.test.ts] [--skip-mutation] [--skip-dead-code]"
allowed-tools: Bash, Read, Write, Edit
---

# /code-quality — Coverage + Mutation + CRAP + Dead Code Analysis

Measures **code coverage**, **mutation testing (Stryker)**, **CRAP scores**, and **dead code** for the specified source files in a single run, then prints a unified quality report with actionable recommendations.

## When to Use

- Before merging a PR that adds or changes business logic
- When tests are green but confidence in coverage quality is low
- After an AI agent (Claude, Cursor, Codex) wrote code — catches AI blind spots (same model writes and reviews, creating systematic gaps)
- Periodic health checks on critical modules

## When Not to Use

- For infrastructure-only changes (CI configs, Dockerfiles, env files) — no meaningful test surface
- For files that are edge-runtime or server-only and cannot be tested in jsdom/node — coverage will be misleadingly low; use E2E instead
- When you need a full security audit — use a dedicated security-review skill

## Options

| Option | Description |
|--------|-------------|
| `[file globs]` | Source files to analyze (space-separated). Omit to auto-detect from `git diff HEAD~1` |
| `--test <glob>` | Test file glob to run. Omit to use the full test suite |
| `--skip-mutation` | Skip Stryker (coverage + CRAP only) |
| `--skip-dead-code` | Skip `knip` dead export scan |

## Config Protection

**Do NOT modify `vitest.config.ts`, `eslint.config.js`, `tsconfig.json`, or any linter config to make tests or checks pass.** Fix the source code. This skill auto-restores `vitest.config.ts` after patching it for coverage measurement.

---

## STEP 0 — Environment detection

Detect test runner and resolve the source file list before doing anything else.

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Detect test runner
if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
  TEST_RUNNER="vitest"
elif [ -f "jest.config.ts" ] || [ -f "jest.config.js" ]; then
  TEST_RUNNER="jest"
else
  echo "ERROR: no vitest/jest config found"; exit 1
fi

# Parse $ARGS with Python — handles flags in any order regardless of position
eval "$(python3 - << 'PY'
import shlex, sys

raw = """$ARGS""".strip()
args = shlex.split(raw) if raw else []

source_files, test_glob = [], ""
skip_mutation = skip_dead_code = False

i = 0
while i < len(args):
    a = args[i]
    if a == "--skip-mutation":   skip_mutation = True
    elif a == "--skip-dead-code": skip_dead_code = True
    elif a == "--test":
        i += 1
        if i < len(args): test_glob = args[i]
    elif not a.startswith("--"): source_files.append(a)
    i += 1

print(f'SOURCE_FILES_RAW={shlex.quote(" ".join(source_files))}')
print(f'TEST_GLOB={shlex.quote(test_glob)}')
print(f'SKIP_MUTATION={1 if skip_mutation else 0}')
print(f'SKIP_DEAD_CODE={1 if skip_dead_code else 0}')
PY
)"

# Resolve source files — use parsed args if given, else git diff
if [ -z "$SOURCE_FILES_RAW" ]; then
  SOURCE_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null \
    | grep -E '\.(ts|tsx|js|jsx)$' | grep -v '\.test\.' | grep -v '__tests__' || true)
  [ -z "$SOURCE_FILES" ] && { echo "ERROR: specify files or have git changes"; exit 1; }
else
  SOURCE_FILES="$SOURCE_FILES_RAW"
fi

echo "Targets:"; echo "$SOURCE_FILES" | tr ' ' '\n' | sed 's/^/  /'
echo "Flags: skip-mutation=$SKIP_MUTATION  skip-dead-code=$SKIP_DEAD_CODE  test-glob=${TEST_GLOB:-(full suite)}"
```

---

## STEP 0.5 — Sanity: TypeScript type-check

Run a type-check before any test or mutation step. Mutation testing on type-erroneous code produces noisy results (mutants fail for wrong reasons).

```bash
# Only run if tsconfig exists
if [ -f "tsconfig.json" ]; then
  echo "=== TypeScript type-check ==="
  TS_ERRORS=$(pnpm tsc --noEmit 2>&1 | grep -c "error TS" || true)
  if [ "$TS_ERRORS" -gt 0 ]; then
    echo "WARNING: $TS_ERRORS TypeScript error(s) found — coverage and mutation results may be unreliable."
    echo "Fix type errors first for accurate results, or acknowledge and continue."
    pnpm tsc --noEmit 2>&1 | grep "error TS" | head -10
  else
    echo "✅ TypeScript: no errors"
  fi
fi
```

> If type errors are present, continue but mark affected files as `⚠ type-errors` in the final report.

---

## STEP 1 — Code coverage

Temporarily patches `vitest.config.ts` with a `coverage` block, runs tests, then restores the original.

```bash
cp vitest.config.ts vitest.config.ts.bak

# Inject coverage block via Python (safe multi-line manipulation)
python3 - << 'PY'
import re, json
config = open("vitest.config.ts").read()
source_files = """$SOURCE_FILES""".strip().split()
block = f"""    coverage: {{
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: {json.dumps(source_files, indent=6)},
    }},"""
new = re.sub(r'(test:\s*\{)', r'\1\n' + block, config, count=1)
open("vitest.config.ts", "w").write(new)
print("coverage block injected")
PY

TEST_GLOB="${TEST_GLOB:-}"
if [ -n "$TEST_GLOB" ]; then
  FORCE_COLOR=0 pnpm vitest run --coverage $TEST_GLOB 2>&1 | tee /tmp/cq_cov.txt
else
  FORCE_COLOR=0 pnpm vitest run --coverage 2>&1 | tee /tmp/cq_cov.txt
fi

# Always restore — even on failure
cp vitest.config.ts.bak vitest.config.ts && rm vitest.config.ts.bak
```

Parse `coverage/coverage-summary.json` and save to `/tmp/cq_coverage.json` for STEP 3:

```bash
python3 - << 'PY'
import json, os

if not os.path.exists("coverage/coverage-summary.json"):
    print("WARNING: no coverage summary (tests may have failed)"); exit(0)

d = json.load(open("coverage/coverage-summary.json"))
source_files = """$SOURCE_FILES""".strip().split()

# Flag files where the test env makes coverage unreliable
EDGE_HINTS  = ["og/lab", "api/og"]
JSDOM_HINTS = ["Section.tsx", "Component.tsx", "Page.tsx"]

print(f"\n{'File':<50} {'Stmt%':>6} {'Br%':>6} {'Fn%':>6}  Note")
print("-" * 85)

cov = {}
for path, data in sorted(d.items()):
    if path == "total": continue
    name = path.split("src/")[-1] if "src/" in path else path.split("/")[-1]

    matched = any(sf.split("/")[-1].rstrip("*") in path for sf in source_files)
    if not matched and source_files: continue

    s, b, f = data["statements"]["pct"], data["branches"]["pct"], data["functions"]["pct"]
    note = ""
    if any(p in path for p in EDGE_HINTS):            note = "* edge runtime"
    elif any(p in path for p in JSDOM_HINTS) and s<30: note = "* needs jsdom"

    cov[name] = {"stmt": s, "branch": b, "fn": f, "note": note}
    print(f"{name:<50} {s:>5.1f}% {b:>5.1f}% {f:>5.1f}%  {note}")

json.dump(cov, open("/tmp/cq_coverage.json", "w"))
t = d.get("total", {})
print(f"\n{'TOTAL':<50} {t.get('statements',{}).get('pct',0):>5.1f}% {t.get('branches',{}).get('pct',0):>5.1f}%")
PY
```

---

## STEP 2 — Cyclomatic Complexity (CC)

> **정확도 한계:** regex 기반 rough estimate. `?.` optional chaining, `??=`/`||=`/`&&=` logical assignment, 복잡하게 중첩된 ternary는 과소/과다 계산될 수 있다. 정밀도가 필요하면 `npx complexity-report` 또는 `oxc`(AST 기반)를 사용할 것. 여기서는 추가 의존성 없이 빠르게 relative comparison을 하는 게 목적이다.

Count branch points per file (comments and string literals stripped first):

```bash
python3 - << 'PY'
import re, json, glob as G

BRANCH = re.compile(
    r'\b(if|else\s+if|for\s*\(|while\s*\(|case\s+|catch\s*\()\b'
    r'|(?<!\?)\?(?!\?|\.|:)(?=\s*\S)'  # ternary (not ?. ??: ?:)
    r'|\?\.'                             # optional chaining ?.
    r'|??='                              # nullish assignment ??=
    r'|\s(&&=|\|\|=)\s'                 # logical assignment &&= ||=
    r'|\s(\?\?|&&|\|\|)\s'              # logical / null-coalescing
)

def strip(src):
    for pat, rep in [
        (r'"(?:[^"\\]|\\.)*"', '""'),
        (r"'(?:[^'\\]|\\.)*'", "''"),
        (r'`(?:[^`\\]|\\.)*`', '``', re.DOTALL),
        (r'//[^\n]*', ''),
        (r'/\*.*?\*/', '', re.DOTALL),
    ]:
        args = [pat, rep] + ([pat[2]] if len(pat) == 3 else [])  # pass flags if any
        try:    src = re.sub(*args)
        except: src = re.sub(pat, rep, src)
    return src

source_files = """$SOURCE_FILES""".strip().split()
cc_map = {}

for pattern in source_files:
    for path in G.glob(pattern, recursive=True) or G.glob(f"**/{pattern}", recursive=True):
        if not path.endswith(('.ts','.tsx','.js','.jsx')): continue
        try:
            cc = 1 + len(BRANCH.findall(strip(open(path).read())))
            key = path.lstrip("./")
            cc_map[key] = cc
            print(f"  CC({path.split('/')[-1]}) = {cc}")
        except FileNotFoundError:
            pass

json.dump(cc_map, open("/tmp/cq_cc.json", "w"))
print(f"\n{len(cc_map)} file(s) measured")
PY
```

---

## STEP 3 — CRAP Score

**Formula:** CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)

```bash
python3 - << 'PY'
import json, os

cov    = json.load(open("/tmp/cq_coverage.json")) if os.path.exists("/tmp/cq_coverage.json") else {}
cc_map = json.load(open("/tmp/cq_cc.json"))       if os.path.exists("/tmp/cq_cc.json")       else {}

def crap(cc, pct):
    c = pct / 100
    return round(cc**2 * (1 - c)**3 + cc, 1)

def grade(score, constrained=False):
    if constrained: return "⚠  env-constrained"
    if score <=  5: return "✅  Excellent"
    if score <= 10: return "🟢  Good"
    if score <= 15: return "🟡  Acceptable"
    if score <= 20: return "🟠  Concerning"
    return               "🔴  Bad"

print("\n" + "=" * 80)
print("CRAP SCORE REPORT")
print("=" * 80)
print(f"{'File':<45} {'CC':>4} {'Cov%':>6} {'CRAP':>8}  Rating")
print("-" * 80)

results = []
for name, cc in sorted(cc_map.items()):
    short = name.split("/")[-1]
    entry = next((v for k, v in cov.items() if short in k), None)
    line_cov    = entry["stmt"]        if entry else 0.0
    constrained = bool(entry.get("note")) if entry else True
    score = crap(cc, line_cov)
    g     = grade(score, constrained)
    results.append((name, cc, line_cov, score, g, constrained))
    print(f"{short:<45} {cc:>4} {line_cov:>5.1f}% {score:>8.1f}  {g}")

print("-" * 80)
real = [r for r in results if not r[5]]
if real:
    avg   = sum(r[3] for r in real) / len(real)
    worst = max(real, key=lambda x: x[3])
    print(f"\nAvg CRAP (env-constrained excluded): {avg:.1f}")
    print(f"Worst: {worst[0].split('/')[-1]} = {worst[3]}")

json.dump([[str(x) for x in r] for r in results], open("/tmp/cq_results.json", "w"))
PY
```

---

## STEP 4 — Mutation Testing (Stryker)

*Skip if `$SKIP_MUTATION` is `1` (set by STEP 0 arg parser).*

```bash
# Auto-install Stryker if missing
if ! ls node_modules/@stryker-mutator/core &>/dev/null 2>&1; then
  echo "Installing Stryker dev deps..."
  pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner --silent
fi

# Dedicated vitest config — only pass the specified (passing) test files
python3 - << 'PY'
import json
test_glob = """${TEST_GLOB:-}""".strip()
include   = json.dumps([test_glob]) if test_glob else '["src/**/*.test.ts","src/**/*.test.tsx"]'
open("vitest.stryker.config.ts", "w").write(
f"""import {{ defineConfig }} from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({{
  plugins: [tsconfigPaths()],
  test: {{ environment: "node", globals: true, include: {include} }},
}});
""")
PY

# Stryker config — timeout scales with file count to prevent false survivors
python3 - << 'PY'
import json
source_files = """$SOURCE_FILES""".strip().split()
# Base 10s + 8s per file, capped at 60s
# 파일이 많을수록 mutant당 실행 시간이 늘어남 — 너무 짧으면 timeout으로 killed 처리돼 false survivor 발생
timeout_ms = min(60000, 10000 + len(source_files) * 8000)
open("stryker.config.mjs", "w").write(
f"""/** @type {{import('@stryker-mutator/core').PartialStrykerOptions}} */
export default {{
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: {{ configFile: "vitest.stryker.config.ts" }},
  mutate: {json.dumps(source_files)},
  reporters: ["clear-text", "json"],
  coverageAnalysis: "perTest",
  timeoutMS: {timeout_ms},
  concurrency: 2,
  warnings: {{ preprocessorErrors: false }},
  jsonReporter: {{ fileName: "/tmp/cq_mutation.json" }},
}};
""")
print(f"Stryker timeoutMS: {timeout_ms}ms ({len(source_files)} file(s))")
PY

FORCE_COLOR=0 pnpm stryker run 2>&1 | tee /tmp/cq_stryker.txt

# Parse mutation results
python3 - << 'PY'
import re

text, lines = open("/tmp/cq_stryker.txt").read(), open("/tmp/cq_stryker.txt").read().split("\n")

# Score table
in_table, table = False, []
for line in lines:
    if "% Mutation score" in line: in_table = True
    if in_table: table.append(line)
    if in_table and not line.strip() and len(table) > 5: break

print("\n" + "=" * 80)
print("MUTATION TEST REPORT")
print("=" * 80)
for l in table: print(l)

# Survived mutants grouped by type
survived, i = [], 0
while i < len(lines):
    if "[Survived]" in lines[i]:
        mtype = lines[i].replace("[Survived]","").strip()
        loc   = lines[i+1].strip() if i+1 < len(lines) else ""
        survived.append((mtype, loc))
    i += 1

if survived:
    by_type = {}
    for t, loc in survived: by_type.setdefault(t, []).append(loc)
    print(f"\nSurvived mutants ({len(survived)}) by type:")
    for t, locs in sorted(by_type.items(), key=lambda x: -len(x[1])):
        print(f"  {t}: {len(locs)}")
        for l in locs[:2]: print(f"    └ {l}")
        if len(locs) > 2: print(f"    └ ... +{len(locs)-2} more")
PY

# Cleanup temp Stryker files
rm -f stryker.config.mjs vitest.stryker.config.ts
rm -rf stryker-tmp/ reports/
```

---

## STEP 4.5 — Dead Code Detection (knip)

*Skip if `$SKIP_DEAD_CODE` is `1` (set by STEP 0 arg parser).*

Find unused exports, files, and dependencies. Complements mutation testing: a file with 100% mutation score but zero external references is dead code.

```bash
# Use pnpm dlx to run knip without modifying package.json or pnpm-lock.yaml.
# Falls back to already-installed local knip if present (faster).
echo "=== Dead code scan (knip) ==="
if ls node_modules/.bin/knip &>/dev/null 2>&1; then
  KNIP_CMD="pnpm knip"
else
  KNIP_CMD="pnpm dlx knip"
fi
FORCE_COLOR=0 $KNIP_CMD --reporter compact 2>&1 | tee /tmp/cq_knip.txt || true

# Parse and summarize
python3 - << 'PY'
import re, os

if not os.path.exists("/tmp/cq_knip.txt"):
    print("(no knip output)"); exit(0)

text = open("/tmp/cq_knip.txt").read()
lines = text.strip().split("\n")

print("\n" + "=" * 80)
print("DEAD CODE REPORT (knip)")
print("=" * 80)

unused_exports, unused_files, unused_deps = [], [], []
for line in lines:
    l = line.strip()
    if not l or l.startswith("✓") or "No issues found" in l:
        continue
    if re.search(r'\.(ts|tsx|js|jsx)', l):
        if "Unused file" in l or line.startswith("✗"):
            unused_files.append(l)
        else:
            unused_exports.append(l)
    elif l:
        unused_deps.append(l)

if not unused_exports and not unused_files and not unused_deps:
    print("✅ No dead code found")
else:
    if unused_files:
        print(f"\nUnused files ({len(unused_files)}):")
        for f in unused_files[:10]: print(f"  🔴 {f}")
    if unused_exports:
        print(f"\nUnused exports ({len(unused_exports)}):")
        for e in unused_exports[:15]: print(f"  🟡 {e}")
    if unused_deps:
        print(f"\nUnused dependencies ({len(unused_deps)}):")
        for d in unused_deps[:10]: print(f"  🟠 {d}")

# STEP 5 교차 분석을 위해 파싱 결과 저장
import json as _json
_json.dump({
    "unused_files": unused_files,
    "unused_exports": unused_exports,
    "unused_deps": unused_deps,
}, open("/tmp/cq_unused.json", "w"))
PY
```

---

## STEP 5 — Final summary report

```bash
python3 - << 'PY'
import json, os, re

print("\n" + "=" * 80)
print("QUALITY REPORT SUMMARY")
print("=" * 80)

def action(cc, cov_pct, crap_score):
    """Return a concrete action based on CC, coverage, and CRAP."""
    high_cc  = int(cc) > 10
    low_cov  = float(cov_pct) < 70
    if not high_cc and not low_cov:  return "✅ OK"
    if high_cc and low_cov:          return "🔴 Add tests + simplify logic"
    if low_cov:                      return "🟡 Add tests (coverage < 70%)"
    if high_cc:                      return "🟠 Simplify logic (CC > 10)"
    return "OK"

if os.path.exists("/tmp/cq_results.json"):
    results = json.load(open("/tmp/cq_results.json"))
    print(f"\n{'File':<40} {'CC':>4} {'Cov%':>6} {'CRAP':>8}  Action")
    print("-" * 80)
    for r in results:
        name, cc, cov_pct, score, grade, constrained = r
        act = "⚠ env-constrained" if constrained == "True" else action(cc, cov_pct, score)
        print(f"{name.split('/')[-1]:<40} {cc:>4} {float(cov_pct):>5.1f}% {float(score):>8.1f}  {act}")

    # Overall quality score (0–100) based on real files only
    real = [r for r in results if r[5] != "True"]
    if real:
        avg_cov  = sum(float(r[2]) for r in real) / len(real)
        avg_crap = sum(float(r[3]) for r in real) / len(real)
        bad_count = sum(1 for r in real if float(r[3]) > 15)

        # 가중치 근거:
        #   coverage(60점) — 테스트가 실행하는 코드 범위, 가장 직접적 품질 신호
        #   CRAP(40점, 역산) — complexity×coverage 조합이지만 CC가 낮으면 커버리지 없어도
        #   CRAP이 낮아 보이는 보정 효과가 있음 → coverage에 더 높은 가중치 부여
        #   CRAP 5 이하 → 만점 40; 5 초과분 × 2점씩 감점; 최대 감점 40
        cov_score  = min(60, avg_cov * 0.6)
        crap_score = max(0, 40 - max(0, avg_crap - 5) * 2)
        quality    = round(cov_score + crap_score)

        band = ("🔴 Needs work" if quality < 50
                else "🟡 Acceptable" if quality < 70
                else "🟢 Good"       if quality < 85
                else "✅ Excellent")

        print(f"\n{'─'*80}")
        print(f"Overall quality score: {quality}/100 — {band}")
        print(f"  Avg coverage: {avg_cov:.1f}%  |  Avg CRAP: {avg_crap:.1f}  |  Files with CRAP>15: {bad_count}")

    print("\n## Action items")
    bad = [r for r in real if float(r[3]) > 15] if real else []
    if bad:
        for r in sorted(bad, key=lambda x: -float(x[3])):
            act = action(r[1], r[2], r[3])
            print(f"  {act}: {r[0].split('/')[-1]} (CRAP={r[3]}, CC={r[1]}, Cov={float(r[2]):.0f}%)")
    else:
        print("  ✅ All measurable files CRAP ≤ 15")

# Dead code × CRAP 교차 분석
# "테스트 품질은 좋은데 어디서도 안 쓰이는 파일" = safe to delete
if os.path.exists("/tmp/cq_unused.json") and os.path.exists("/tmp/cq_results.json"):
    unused = json.load(open("/tmp/cq_unused.json"))
    results_loaded = json.load(open("/tmp/cq_results.json"))
    unused_names = set()
    for entry in unused.get("unused_files", []) + unused.get("unused_exports", []):
        m = re.search(r'[\w./\-]+\.(ts|tsx|js|jsx)', entry)
        if m: unused_names.add(m.group(0).split("/")[-1])

    safe_deletes = []
    for r in results_loaded:
        fname = r[0].split("/")[-1]
        crap_score_val = float(r[3])
        constrained = r[5]
        if fname in unused_names and crap_score_val <= 10 and constrained != "True":
            safe_deletes.append((fname, crap_score_val, float(r[2])))

    if safe_deletes:
        print("\n## Dead code × quality crossref")
        print("  These files are unused (knip) AND have low CRAP — safe to delete:")
        for fname, crap_val, cov_pct in safe_deletes:
            print(f"  🗑  {fname}  (CRAP={crap_val}, Cov={cov_pct:.0f}%)")

# Remove temp files
for f in ["/tmp/cq_coverage.json","/tmp/cq_cc.json","/tmp/cq_results.json",
          "/tmp/cq_cov.txt","/tmp/cq_stryker.txt","/tmp/cq_knip.txt","/tmp/cq_unused.json",
          "/tmp/cq_mutation.json"]:
    if os.path.exists(f): os.remove(f)
PY
```

---

## Usage examples

```bash
# Named files
/code-quality src/lib/project-html-blob.ts src/app/api/admin/projects/upload/route.ts

# With specific tests, skip mutation
/code-quality src/lib/foo.ts --test "src/__tests__/api/foo.test.ts" --skip-mutation

# Coverage + CRAP only, no dead code scan
/code-quality src/hooks/useFilter.ts --skip-mutation --skip-dead-code

# Auto-detect from git diff
/code-quality
```

## CRAP thresholds

| CRAP | Rating | Action |
|------|--------|--------|
| ≤ 5  | ✅ Excellent | None needed |
| 6–10 | 🟢 Good | Monitor |
| 11–15 | 🟡 Acceptable | Consider coverage increase |
| 16–20 | 🟠 Concerning | Add tests or reduce CC |
| > 20  | 🔴 Bad | Refactor immediately |

## Overall quality score bands

| Score | Band | Meaning |
|-------|------|---------|
| 85–100 | ✅ Excellent | Ship with confidence |
| 70–84 | 🟢 Good | Minor improvements welcome |
| 50–69 | 🟡 Acceptable | Target specific weak spots |
| < 50  | 🔴 Needs work | Don't ship critical paths until resolved |

> **CC counting rule:** 1 + branches (`if`, `for`, `while`, `case`, `catch`, ternary `?`, `&&`, `||`, `??`)
>
> **Env-constrained files** (edge runtime / jsdom required) are excluded from the average CRAP but shown with `⚠ env-constrained`.
>
> **AI blind spot note:** When an AI agent wrote the code being tested, the same model reviewing it carries identical assumptions. Mutation testing (Stryker) is the best antidote — it surfaces cases the model systematically missed writing tests for.
