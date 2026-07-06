# Harness 100

Production-grade agent team harness collection for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

100 ready-to-use harnesses across 10 domains — each with 4-5 specialist agents, an orchestrator skill, and 2-3 agent-extending skills. Available in **Korean** and **English**.

> **[English (en/)](en/)** | **[Korean (ko/)](ko/)**

## At a Glance

| | ko/ | en/ | Total |
|---|-----|-----|-------|
| Harnesses | 100 | 100 | 200 |
| Agent definitions | 489 | 489 | 978 |
| Skills | 315 | 315 | 630 |
| Total .md files | 904 | 904 | **1,808** |

## Quick Start

```bash
# Copy any harness into your project
cp -r ko/01-youtube-production/.claude/ /path/to/my-project/.claude/

# Or use the English version
cp -r en/01-youtube-production/.claude/ /path/to/my-project/.claude/
```

## Categories

| # | Category | Harnesses | Highlights |
|---|----------|-----------|------------|
| 1 | Content Creation | 01-15 | YouTube, podcast, game narrative, comics, translation |
| 2 | Software Dev & DevOps | 16-30 | Full-stack, API, CI/CD, security audit, IaC |
| 3 | Data & AI/ML | 31-42 | ML experiments, NLP, RAG/LLM apps, design systems |
| 4 | Business & Strategy | 43-55 | Startup, market research, pricing, financial modeling |
| 5 | Education & Learning | 56-65 | Language tutor, exam prep, debate simulator, ADR |
| 6 | Legal & Compliance | 66-72 | Contracts, patents, GDPR/PIPA, regulatory filing |
| 7 | Health & Lifestyle | 73-80 | Meal planning, fitness, tax, travel, wedding |
| 8 | Communication & Docs | 81-88 | Technical writing, SOP, proposals, crisis comms |
| 9 | Operations & Process | 89-95 | Hiring, onboarding, audit, procurement |
| 10 | Specialized Domains | 96-100 | Real estate, e-commerce, ESG, IP portfolio |

## Harness Architecture

```
{NN}-{harness-name}/
└── .claude/
    ├── CLAUDE.md                    # Project overview
    ├── agents/
    │   ├── {specialist-1}.md        # Domain expert agent
    │   ├── {specialist-2}.md
    │   ├── {specialist-3}.md
    │   ├── {specialist-4}.md
    │   └── {reviewer/qa}.md         # Cross-validation agent
    └── skills/
        ├── {orchestrator}/
        │   └── skill.md             # Team orchestration
        ├── {domain-skill-1}/
        │   └── skill.md             # Agent-extending skill
        └── {domain-skill-2}/
            └── skill.md             # Agent-extending skill
```

### Three-Layer Skill System

| Layer | Purpose | Example |
|-------|---------|---------|
| **Orchestrator** | Team coordination, workflow, error handling | `youtube-production/skill.md` |
| **Agent-Extending** | Domain knowledge that amplifies agent expertise | `hook-writing/skill.md`, `thumbnail-psychology/skill.md` |
| **External** | Existing tools (Gemini image gen, web search) | `gemini-3-pro-imagegen` |

## Quality Standards

Every harness includes:

- **Agent Team Mode** — SendMessage direct communication, cross-validation
- **Domain Expertise** — Real frameworks (OWASP, Bloom's Taxonomy, Porter's 5 Forces, DCF, etc.)
- **Structured Outputs** — Domain-specific templates per agent
- **Dependency DAG** — Task ordering with parallel execution
- **Error Handling** — Retry, skip, fallback strategies
- **Scale Modes** — Full pipeline / reduced / single-agent
- **Test Scenarios** — Normal / existing-file / error (3 types)
- **Trigger Boundaries** — Should-trigger + NOT-trigger defined

## Domain Expertise

| Domain | Embedded Frameworks |
|--------|-------------------|
| Content | AIDA, Pattern Interrupt, CURVE formula, Platform Specs |
| Development | SOLID, DDD, OWASP Top 10, Test Pyramid, DORA Metrics, CWE Top 25 |
| Data | Star/Snowflake Schema, Great Expectations, SHAP/LIME, Feature Engineering |
| Business | BMC, TAM/SAM/SOM, Porter's 5 Forces, RICE, Van Westendorp PSM |
| Education | Bloom's Taxonomy, ADDIE, CEFR, SM-2 Spaced Repetition, Toulmin Model |
| Legal | IRAC, MQM, GDPR/PIPA, IPC/CPC, Claim Drafting Patterns |
| Lifestyle | BMR/TDEE, ACSM Guidelines, Compound Interest, Route Optimization |
| Documents | Diataxis, PREP, STAR, MADR, SemVer, Mermaid Patterns |
| Operations | SIPOC/RACI, 4C Framework, SMART, NPS/CSAT, BARS Assessment |
| Specialized | GHG Protocol, Cap Rate/IRR, IMRaD, Georgia-Pacific, Double Materiality |

## License

Apache License 2.0 — See [LICENSE](LICENSE)
