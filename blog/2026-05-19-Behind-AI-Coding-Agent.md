---
title: Behind the Curtain: What Really Happens When You Send a Prompt to an AI Coding Agent
date: 2026-05-19
author: Faris
tags: ai, ai coding agents, software engineering, developer tools, LLMs
image: https://i.imgur.com/fSwjgFr.png
---

_A technical guide for everyone — from curious developers to tech decision-makers._

---

You type: _"Create a REST endpoint for file uploads."_

Seconds later, Claude Code opens a terminal, reads your project structure, writes the code, runs the tests, and fixes the errors — all without you touching the keyboard again.

Magic? No. Architecture. And understanding that architecture will permanently change how you work with these tools.

---

## The Problem With How Most People See It

Most people picture an AI coding agent as a very smart autocomplete. You type something → AI responds.

The reality is far more complex — and far more interesting.

AI coding agents aren't chatbots. They're **autonomous loops** that can plan, execute, observe results, and repeat that cycle until the job is done. Behind all of it is a fundamental mechanism that's rarely discussed: **how the AI actually receives and processes input**.

Let's break it down, layer by layer.

---

## The Foundation: The Agent Loop

Before talking about prompts, we need to understand the mental model behind every modern AI coding agent.

Almost all of them — Claude Code, Codex CLI, Plandex, Aider, even OpenClaw — follow the same pattern, known in AI literature as the **ReAct loop** (Reason + Act):

```
┌────────────────────────────────────────────────────┐
│                    AGENT LOOP                      │
│                                                    │
│  1. THINK   →  What do I need to do here?          │
│  2. ACT     →  Call a tool (read file, run cmd)    │
│  3. OBSERVE →  What was the result?                │
│  4. REPEAT  →  Is the task complete?               │
│                                                    │
└────────────────────────────────────────────────────┘
```

Every turn of this loop produces one or more **API calls to the underlying AI model** (GPT-4o, Claude Sonnet, Gemini, etc.). And each of those API calls carries **the entire accumulated context** — all previous messages, tool results, and system instructions.

This is what separates an AI agent from a chatbot: **the context keeps growing** as the agent works.

---

## The Anatomy of a Prompt: It's Not Just Your Text

When you send a command to an AI coding agent, what the backend model actually receives isn't just your sentence. There's a **complete package** assembled by the framework before anything reaches the model.

That package has several distinct layers:

### 1. System Prompt — Identity and Ground Rules

This is the deepest layer. It's written by the agent's development team — not by you — and you almost never see it.

The system prompt defines:

- **Who** the agent is (name, personality, communication style)
- **What it can and cannot do** (safety limits, behavioral policies)
- **Expected output format** (JSON, markdown, code, etc.)
- **How to use available tools**

Here's a simplified example of what Claude Code's system prompt might look like:

```
You are Claude Code, an AI coding assistant. You operate inside a
developer's terminal and have access to their filesystem and shell.

Rules:
- Always read relevant files before making changes
- Never delete files without explicit confirmation
- When running commands, prefer safe, reversible operations first
- Format code according to the project's existing style
```

This layer is **permanent** — it's present in every single API call throughout the session. This is why agents have consistent "personalities" across an entire interaction.

> **What's happening under the hood:** Claude Code, Codex CLI, and every other agent ship with very long system prompts — some running into thousands of tokens. They define capabilities, constraints, and reasoning patterns in exhaustive detail.

---

### 2. User Message — Your Command

This is the part you know: what you actually type.

But here's the interesting part — **agent frameworks often append extra context** to your message before it reaches the model. For example:

```
[What you typed]
"Add email validation to the registration form"

[What actually gets sent to the model]
"Add email validation to the registration form

Current working directory: /home/user/myapp
Active files: src/components/RegisterForm.tsx, src/utils/validators.ts
Recent git changes: Modified LoginForm.tsx 2 hours ago"
```

The framework "wraps" your message with relevant metadata. The result: the model has a much richer context to understand what you actually mean.

---

### 3. Tool Definitions — The Agent's Capabilities

This is the most underrated layer, and truly understanding it will change how you see AI agents.

Modern LLMs (GPT-4, Claude, Gemini) support a feature called **function calling** or **tool use**. This means that instead of only producing text, the model can decide to "call a function" with specific parameters.

The agent framework registers a set of tools with the model, each defined by:

- A name
- A description of what the tool does
- The parameters it accepts (data types, required vs. optional)

Here's what tool definitions in Claude Code might look like:

```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read the contents of a file at the given path",
      "parameters": {
        "path": { "type": "string", "required": true },
        "start_line": { "type": "number", "required": false },
        "end_line": { "type": "number", "required": false }
      }
    },
    {
      "name": "write_file",
      "description": "Create or overwrite a file with the given content",
      "parameters": {
        "path": { "type": "string", "required": true },
        "content": { "type": "string", "required": true }
      }
    },
    {
      "name": "execute_command",
      "description": "Run a shell command and return stdout/stderr",
      "parameters": {
        "command": { "type": "string", "required": true },
        "working_dir": { "type": "string", "required": false }
      }
    },
    {
      "name": "search_codebase",
      "description": "Search for a pattern across all files in the project",
      "parameters": {
        "query": { "type": "string", "required": true },
        "file_pattern": { "type": "string", "required": false }
      }
    }
  ]
}
```

**The model doesn't actually "run" these tools.** What the model does is produce structured text that says "I want to call tool X with parameters Y." The framework then actually executes that function on your machine and sends the result back.

This is the fundamental distinction: **the model talks, the framework acts**.

---

### 4. Conversation History — Session Memory

Every tool call, execution result, and response from you is saved as part of the conversation history. And that history **travels along** with every subsequent API call.

Picture it like this:

```
[system]    → Agent identity and rules
[user]      → "Add email validation"
[assistant] → "I'll read RegisterForm.tsx first"
              [tool_call: read_file("src/components/RegisterForm.tsx")]
[tool]      → "export function RegisterForm() { ... }"  ← file contents
[assistant] → "Got it. Now I'll make the edit..."
              [tool_call: write_file(...)]
[tool]      → "File written successfully"
[assistant] → "Done! I added validation using the RFC 5322 regex..."
[user]      → "Run the tests"
[assistant] → [tool_call: execute_command("npm test")]
[tool]      → "✓ 24 tests passed"
```

All of that gets sent together in the final API call. The model "sees" the full conversation context every time it's asked for a response.

> **The implication:** The longer your working session with an agent, the larger the package being sent, the more tokens consumed, and the higher the cost. This is exactly why modern agents ship with "context compression" or "summarization" features to trim history that's no longer relevant.

---

### 5. Skills and Memory — Persistent Context

Some modern agents add a fifth layer: **skills** and **memory files**.

**Skills** are markdown files containing task-specific instructions that get injected into the context when the agent performs a particular type of work. Think of them as a "cheat sheet" handed to the agent before it starts a specific job.

Example: when you ask the agent to deploy to Netlify, a skill file like `netlify-deploy/SKILL.md` gets automatically read, and its contents are inserted into the active context. The agent immediately knows the exact commands to run — no guessing required.

**Memory files** (like `MEMORY.md`, `USER.md`, `SOUL.md` in OpenClaw) are documents that are always present in every context window — they contain who you are, your preferences, and what projects you're currently working on. This is what makes an agent feel like it _knows_ you, even though every session technically starts from scratch.

```
┌──────────────────────────────────────────────┐
│           WHAT GETS SENT TO THE MODEL        │
│                                              │
│  System Prompt    → Who the agent is         │
│  Memory Files     → Who you are              │
│  Skill Files      → How to do this task      │
│  Tool Definitions → What the agent can do    │
│  Conversation     → What has happened so far │
│  User Message     → What you're asking for   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Comparing Claude Code vs. Codex CLI vs. Aider

Each agent takes a slightly different approach, even though the underlying architecture is the same.

| Aspect               | Claude Code                | Codex CLI (OpenAI)        | Aider                     |
| -------------------- | -------------------------- | ------------------------- | ------------------------- |
| **Model**            | Claude Sonnet/Opus         | GPT-4o / o3               | Multi-model               |
| **Tool Approach**    | Native tool use            | Native function calling   | Git-diff patching         |
| **Context Strategy** | Long context + compression | Moderate context          | Git history as context    |
| **Strength**         | Deep codebase reasoning    | Speed + coding benchmarks | Git-native, open source   |
| **File Editing**     | Direct write tool          | Patch via function call   | Generate diff, then apply |

**Aider** has a particularly interesting approach worth calling out. Instead of giving the model direct filesystem access, Aider asks the model to produce a _git diff_ — a patch in standard format. Aider then applies that patch. It's more deterministic and easier to review, but less flexible for tasks that require exploratory work.

---

## What Actually Happens When You Hit Enter

Let's trace one complete request, start to finish:

**You type:** `"Refactor getUserData so the error handling is cleaner"`

**Step 1 — Assembling context:**
The framework collects: system prompt + memory files + tool definitions + conversation history + your message → one large package (could be 10,000–100,000 tokens).

**Step 2 — First LLM call:**
The package is sent to the model. The model thinks: _"I need to read getUserData before I can refactor anything."_ It produces a tool call: `read_file("src/services/user.service.ts")`.

**Step 3 — Tool execution:**
The framework intercepts the tool call, reads the actual file on your machine, and appends the result to the conversation history.

**Step 4 — Second LLM call:**
The context is now longer (it includes the file contents). The model reads the code, analyzes the existing error handling, and produces a refactored version. It calls `write_file(...)` with the new code.

**Step 5 — Verification loop:**
The agent may call `execute_command("npm run lint && npm test")` to confirm nothing is broken. If errors appear, the loop continues.

**Step 6 — Final response:**
Everything checks out. The model produces an explanation for you: what changed and why.

**Total LLM calls for one "simple" command: 3–6.**
**Total tokens consumed: roughly 20,000–50,000.**

---

## Why This Actually Matters for You

Understanding this architecture isn't academic nerd trivia. It has direct practical implications.

**1. Better prompts = better context**

The agent can't read your mind. But it can read context. The more specific you are about what you want, what tech stack you're using, and what constraints apply — the fewer guesses the model has to make.

_Weak:_ `"Fix this bug"`
_Strong:_ `"The calculateTax function in tax.service.ts returns a negative value when the discount input exceeds 100%. Fix it by adding input validation, and add test cases covering this edge case."`

**2. Long sessions ≠ efficient sessions**

Because history keeps growing, a very long session can make the agent slower and more expensive. For a completely different task, it's often more effective to start a fresh session with a clean context.

**3. Know what tools are available**

An agent can only do what its tools allow. If your agent doesn't have a web browsing tool, it can't fetch the latest documentation. If there's no database access tool, it can't inspect your actual schema. **Tool limits are agent limits.**

**4. System prompts can be customized**

Many agents let you add custom instructions to the system prompt (often labeled "custom instructions" or an `AGENTS.md` file). Use this to define your coding style, architectural preferences, or team conventions — the agent will follow them consistently across every session.

---

## The Road Ahead: From Tool Use to Multi-Agent

Everything we've covered describes a single-agent architecture. But the industry is clearly moving toward **multi-agent systems**.

Picture this: one "orchestrator agent" takes your task, then delegates to several "sub-agents" running in parallel — one writes the code, one writes the tests, one updates the documentation. The orchestrator compiles everything and hands it back to you.

Claude Code is already moving in this direction with sub-agent spawning. OpenClaw has `sessions_spawn` for parallel task execution. The pattern is becoming standard.

The implication is significant: more complexity, more capability, more cost, and a greater need to understand how all of this fits together.

---

## Closing Thoughts

You don't need to be an ML engineer to get the most out of AI coding agents. But understanding that behind every prompt there are **layers of system instructions, tool definitions, conversation history, and memory context** all working together — that's what separates a casual user from someone who's genuinely productive with these tools.

AI coding agents aren't magic. They're very well-engineered systems. And the better you understand the machine, the more precisely you can drive it.
