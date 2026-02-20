# Model Router Skill

## Metadata

```yaml
name: model-router
version: 1.0.0
description: Intelligently route tasks to appropriate Claude model based on complexity
author: CPET Team
triggers:
  - patterns:
      - "(?:implement|build|create|develop|add|write|refactor|redesign|optimize|architect).*\\b(?:API|endpoint|feature|component|function|system|pipeline|framework|architecture)\\b"
      - "(?:plan|design|architect).*(?:full-stack|entire|comprehensive|system-wide|large-scale)"
      - "(?:refactor|rewrite|redesign)\\b.{0,50}\\b(?:all|entire|whole|complete|major)"
      - "(?:what|which|list|find|show|explain|describe)\\b.*\\b(?:files|functions|modules|components|how|logic)\\b"
      - "(?:analyze|investigate|debug|profile|check).*\\b(?:performance|efficiency|bottleneck|issue|problem)\\b"
    model_hints:
      - pattern: "(?:implement|build|develop)\\b.{0,100}\\b(?:API|endpoint|feature|component)\\b(?!.*refactor)(?!.*optimize)"
        model: sonnet
        reason: "Medium-scale feature implementation"
      - pattern: "(?:what|which|list|find|explain)\\b"
        model: haiku
        reason: "Simple query or search"
      - pattern: "(?:plan|design|architect|refactor|redesign|rewrite).*\\b(?:entire|all|whole|comprehensive|full-stack|system-wide)"
        model: opus
        reason: "Large-scale architecture or design"
      - pattern: "(?:analyze|profile|debug|optimize).*\\b(?:performance|efficiency|bottleneck)"
        model: sonnet
        reason: "Detailed analysis task"

proactive: true
auto_trigger: true
```

## How It Works

Automatically detects task complexity from user input and routes to the appropriate model:

### Detection Rules

1. **Haiku (Fast)** - Triggered by:
   - Questions: "What files...", "Which modules...", "Explain...", "List..."
   - Simple searches or lookups
   - Code reading/understanding

2. **Sonnet (Balanced)** - Triggered by:
   - Feature implementation: "Implement new API endpoint..."
   - Detailed analysis: "Analyze performance..."
   - Medium-scale changes (3-5 files)

3. **Opus (Deep)** - Triggered by:
   - Architecture terms: "design", "architect", "plan"
   - Scale keywords: "entire", "all", "full-stack", "comprehensive"
   - Large refactoring: "Refactor entire...", "Redesign..."

## Examples

```
User: "What files contain FATMAX logic?"
→ Auto-triggers Haiku

User: "Implement new API endpoint /api/vo2max/export"
→ Auto-triggers Sonnet

User: "Design the entire data pipeline from collection to visualization"
→ Auto-triggers Opus
```

## Integration with Project-Specific Guides

⚠️ **IMPORTANT**: This skill applies global rules to ALL projects.

### How to Use
1. **Automatic routing** (default): Model Router suggests based on input
2. **Project override**: Check CLAUDE.md for project-specific recommendations
3. **Explicit override**: Use `[Opus]`, `[Sonnet]`, or `[Haiku]` prefix to force specific model

### Project-Specific Customizations

Each project can add a **Model Selection** section to CLAUDE.md:

```markdown
## Model Selection for This Project

### Haiku (Fast)
- Project-specific simple tasks
- [Examples for this project]

### Sonnet (Balanced, Recommended Default)
- Project-specific medium tasks
- [Examples for this project]

### Opus (Deep)
- Project-specific complex tasks
- [Examples for this project]
```

**Examples**:
- `jira.javis/CLAUDE.md` → Favors **Sonnet** (complex sync logic)
- `edwards.web.simulator/CLAUDE.md` → Favors **Sonnet** (widget optimization)
- `unifyplasma/CLAUDE.md` → May favor **Haiku** (depends on domain)

### When Model Router Conflicts with CLAUDE.md

Model Router provides auto-suggestions, but CLAUDE.md is the source of truth for each project:

```
Scenario: "Review this PR"
├─ Model Router: Might suggest Haiku (if regex matches "review")
└─ jira.javis/CLAUDE.md: States "Code review → Sonnet"

Action: Follow the CLAUDE.md guidance ✅
```

---

## Governance & Maintenance

### Who can modify these rules?
- **Global rules** (this file): Requires review from 2+ projects
- **Project rules** (CLAUDE.md): Project maintainers only

### How to request changes?
1. Identify which rules need updating
2. Explain why (e.g., "Korean language support needed")
3. Show impact: "Affects Haiku routing for 30% of queries"
4. Propose solution: "Add Korean regex patterns"
5. Get feedback from 2+ project teams
6. Submit PR to this skill

### Last Updated
- **Version**: 1.0.0
- **Updated**: 2026-02-20
- **Status**: Stable with project overrides
