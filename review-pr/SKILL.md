---
name: review-pr
description: "PR code review. Input URL → code analysis → post structured review comment + save MD. Auto-detects domain (backend/frontend/PLC). Usage: /review-pr <PR_URL>"
argument-hint: "<pr_url> [--no-post] [--no-save]"
allowed-tools: Bash(python3 *), Read, Grep, WebFetch
---

# /review-pr - PR Code Review

Analyzes code from a Bitbucket PR URL and automatically posts structured review comments to the PR. Auto-detects the code domain (backend, frontend, PLC) from file extensions in the diff.

## Options

| Option | Description |
|--------|-------------|
| (none) | Review + post PR comment + save local MD |
| `--no-post` | Skip posting PR comment (analysis only) |
| `--no-save` | Skip saving local MD file |

---

## Required Execution Workflow

Follow the steps below in order. Do not skip any step.

### Step 1: Parse Arguments

Parse the PR URL and options from user input.

```
Input: <pr_url> [--no-post] [--no-save]
```

### Step 2: Fetch PR Data

```bash
python3 scripts/review_pr.py fetch <pr_url>
```

Analyze the JSON output. If a `diff_file` key exists, the diff was saved to a separate file — read it using the Read tool.

### Step 3: Auto-Detect Domain & Analyze Code

1. Read the entire diff and detect the primary domain from file extensions:
   - **Backend**: `.py`, `.go`, `.java`, `.cs`, `.rb`, `.rs`, `.sql`, `.env`, `Dockerfile`
   - **Frontend**: `.tsx`, `.jsx`, `.ts` (in `src/components/`), `.css`, `.scss`, `.vue`, `.svelte`
   - **PLC**: `.ST`, `.st`, `.xml` (PLCOpen format)
   - **Mixed/General**: Falls back to the generic review rubric
2. Load the appropriate domain reference file:
   - Backend → [../review-backend/reference.md](../review-backend/reference.md)
   - Frontend → [../review-frontend/reference.md](../review-frontend/reference.md)
   - PLC → [../review-plc/reference.md](../review-plc/reference.md) + [../review-plc/plc-architecture-guide.md](../review-plc/plc-architecture-guide.md)
   - Mixed/General → [reference.md](reference.md)
3. Analyze the diff using the domain-specific review perspectives.
4. Review the target branch history for related commits to understand root cause.
5. Write a structured review following the domain reference's **output format**.
6. Save to `/tmp/review_pr_{id}.md` as a temp file.

**Review language**: Write the review in Korean.

### Step 4: Post Comment to PR

Execute only if `--no-post` option is **NOT** present.

```bash
python3 scripts/review_pr.py comment <pr_url> < /tmp/review_pr_{id}.md
```

### Step 5: Save Local MD

Execute only if `--no-save` option is **NOT** present.

1. Get filename info:
```bash
python3 scripts/review_pr.py save <pr_url>
```

2. Save the `/tmp/review_pr_{id}.md` content to `reviews/{filename}`. Create the `reviews/` directory if it doesn't exist.

### Step 6: Summary

Show the user a summary of results:
- PR info reviewed (title, branch, author)
- Number of issues found (must-fix before merge / suggested improvements)
- Final verdict (APPROVED / APPROVED with suggestions / CHANGES REQUESTED)
- Comment posting status and URL
- MD save path

## Resources

- General review rubric & output format: [reference.md](reference.md)
- Backend-specific review rubric: [../review-backend/reference.md](../review-backend/reference.md)
- Frontend-specific review rubric: [../review-frontend/reference.md](../review-frontend/reference.md)
- PLC-specific review rubric: [../review-plc/reference.md](../review-plc/reference.md)
- PLC architecture guide: [../review-plc/plc-architecture-guide.md](../review-plc/plc-architecture-guide.md)
- Usage examples: [examples.md](examples.md)
- API helper script: [scripts/review_pr.py](scripts/review_pr.py)
