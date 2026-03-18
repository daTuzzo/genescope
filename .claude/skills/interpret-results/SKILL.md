---
name: interpret-results
description: "V1 re-interpretation — read existing v1 findings.json and write Claude-interpreted reports. For V2 analysis use /analyze-genome-v2 instead."
user-invocable: true
argument-hint: "name"
---

# Re-interpret V1 Findings

Read `profiles/<name>/v1/findings.json` and write Claude-interpreted reports to `profiles/<name>/v1/`.

For full V2 analysis with agent teams and research, use `/analyze-genome-v2` instead.

**Arguments:**
- `$ARGUMENTS[0]` — Profile name

## Steps

1. Read `profiles/<name>/v1/findings.json`
2. Read `profiles/<name>/intake.json` if it exists
3. Write interpreted reports to `profiles/<name>/v1/`:
   - `claude-genetic-report.md`
   - `claude-disease-risk.md`
   - `claude-health-protocol.md`
4. Cross-reference findings, flag interactions, provide actionable takeaways
