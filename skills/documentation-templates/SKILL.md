---
name: documentation-templates
description: "Documentation templates and structure guidelines. README, API docs, code comments, and AI-friendly documentation."
risk: safe
source: community
date_added: "2026-02-27"
---

# Documentation Templates

> Templates and structure guidelines for common documentation types.

## 1. README Structure

| Section | Purpose |
|---------|---------|
| **Title + One-liner** | What is this? |
| **Quick Start** | Running in <5 min |
| **Features** | What can I do? |
| **Configuration** | How to customize |
| **API Reference** | Link to detailed docs |
| **Contributing** | How to help |
| **License** | Legal |

## 2. API Documentation Per-Endpoint

```markdown
## GET /users/:id

Get a user by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**
- 200: User object
- 404: User not found
```

## 3. Code Comment Guidelines

### When to Comment
| ✅ Comment | ❌ Don't Comment |
|-----------|-----------------|
| Why (business logic) | What (obvious) |
| Complex algorithms | Every line |
| Non-obvious behavior | Self-explanatory code |
| API contracts | Implementation details |

### JSDoc Template
```typescript
/**
 * Brief description of what the function does.
 * 
 * @param paramName - Description
 * @returns Description
 * @throws ErrorType - When this error occurs
 * 
 * @example
 * const result = functionName(input);
 */
```

## 4. Architecture Decision Record (ADR)

```markdown
# ADR-001: [Title]

## Status: Accepted / Deprecated / Superseded
## Context: Why are we making this decision?
## Decision: What did we decide?
## Consequences: What are the trade-offs?
```

## Structure Principles
| Principle | Why |
|-----------|-----|
| **Scannable** | Headers, lists, tables |
| **Examples first** | Show, don't just tell |
| **Progressive detail** | Simple → Complex |
| **Up to date** | Outdated = misleading |

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.
