---
name: gemini-claude-loop
description: Orchestrates a dual-AI engineering loop where Claude plans and implements, while Gemini validates and reviews, with continuous feedback for optimal code quality
---

# Gemini-Claude Engineering Loop Skill

## Core Workflow Philosophy
This skill implements a balanced engineering loop:
- **Claude**: Architecture, planning, and execution
- **Gemini**: Validation and code review
- **Continuous Review**: Each AI reviews the other's work
- **Context Handoff**: Always continue with whoever last cleaned up

## Phase 1: Planning with Claude
1. Start by creating a detailed plan for the task
2. Break down the implementation into clear steps
3. Document assumptions and potential issues
4. Output the plan in a structured format

## Phase 2: Plan Validation with Gemini
1. Send the plan to Gemini for validation:
```bash
   echo "Review this implementation plan and identify any issues:
   [Claude's plan here]
   
   Check for:
   - Logic errors
   - Missing edge cases
   - Architecture flaws
   - Security concerns" | gemini --sandbox
```
2. Capture Gemini's feedback

## Phase 3: Feedback Loop
If Gemini finds issues:
1. Summarize Gemini's concerns to the user
2. Refine the plan based on feedback
3. Ask user (via `AskUserQuestion`): "Should I revise the plan and re-validate, or proceed with fixes?"
4. Repeat Phase 2 if needed

## Phase 4: Execution
Once the plan is validated:
1. Claude implements the code using available tools (Edit, Write, Read, etc.)
2. Break down implementation into manageable steps
3. Execute each step carefully with proper error handling
4. Document what was implemented

## Phase 5: Cross-Review After Changes
After every change:
1. Send Claude's implementation to Gemini for review:
   - Bug detection
   - Performance issues
   - Best practices validation
   - Security vulnerabilities
```bash
   echo "Review this implementation:
   [Description of changes or code snippet]
   " | gemini --sandbox
```
2. Claude analyzes Gemini's feedback and decides:
   - Apply fixes immediately if issues are critical
   - Discuss with user if architectural changes needed
   - Document decisions made

## Phase 6: Iterative Improvement
1. After Gemini review, Claude applies necessary fixes
2. For significant changes, send back to Gemini for re-validation
3. Continue the loop until code quality standards are met
4. Use `gemini --resume latest` to continue validation sessions:
```bash
   echo "Review the updated implementation" | gemini --resume latest
```

## Recovery When Issues Are Found
When Gemini identifies problems:
1. Claude analyzes the root cause
2. Implements fixes using available tools
3. Sends updated code back to Gemini for verification
4. Repeats until validation passes

## Best Practices
- **Always validate plans** before execution
- **Never skip cross-review** after changes
- **Maintain clear handoff** between AIs
- **Document who did what** for context
- **Use resume** to preserve session state

## Command Reference
| Phase | Command Pattern | Purpose |
|-------|----------------|---------|
| Validate plan | `echo "plan" \| gemini --sandbox` | Check logic before coding |
| Implement | Claude uses Edit/Write tools | Claude implements the validated plan |
| Review code | `echo "review changes" \| gemini --sandbox` | Gemini validates Claude's implementation |
| Continue review | `echo "next step" \| gemini --resume latest` | Continue validation session |
| Apply fixes | Claude uses Edit/Write tools | Claude fixes issues found by Gemini |
| Re-validate | `echo "verify fixes" \| gemini --resume latest` | Gemini re-checks after fixes |

## Error Handling
1. Stop on non-zero exit codes from Gemini
2. Summarize Gemini feedback and ask for direction via `AskUserQuestion`
3. Before implementing changes, confirm approach with user if:
   - Significant architectural changes needed
   - Multiple files will be affected
   - Breaking changes are required
4. When Gemini warnings appear, Claude evaluates severity and decides next steps

## The Perfect Loop
```
Plan (Claude) → Validate Plan (Gemini) → Feedback →
Implement (Claude) → Review Code (Gemini) →
Fix Issues (Claude) → Re-validate (Gemini) → Repeat until perfect
```

This creates a self-correcting, high-quality engineering system where:
- **Claude** handles all code implementation and modifications
- **Gemini** provides validation, review, and quality assurance