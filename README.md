<p align="center">
  <br />
  <a href="https://v16.ai">
    <img src="https://v16.ai/logo.png" alt="V16" width="80" />
  </a>
  <br />
</p>

<h1 align="center">V16 Agents</h1>

<p align="center">
  <strong>Run hundreds of autonomous AI agents on your machine.<br />Automate everything — code, workflows, ops, outreach, and more.</strong>
</p>

<br />

<p align="center">
  <code>npm install -g v16.ai && v16 connect</code>
</p>

<br />

<p align="center">
  <em>"What if every repetitive task you do had an AI agent doing it for you, 24/7?"</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/v16.ai"><img src="https://img.shields.io/npm/v/v16.ai?style=flat-square&color=cb6839" alt="npm" /></a>
  <a href="https://github.com/anup-singhai/v16-agents/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <a href="https://v16.ai"><img src="https://img.shields.io/badge/platform-v16.ai-black?style=flat-square" alt="V16" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="Node 18+" /></a>
</p>

<p align="center">
  <a href="https://v16.ai">Website</a> &nbsp;&middot;&nbsp;
  <a href="https://v16.ai/dashboard">Dashboard</a> &nbsp;&middot;&nbsp;
  <a href="#-install">Install</a> &nbsp;&middot;&nbsp;
  <a href="#-architecture">Architecture</a> &nbsp;&middot;&nbsp;
  <a href="#-contributing">Contributing</a>
</p>

<br />

---

<br />

### What people automate with V16

| | |
|:--|:--|
| **Code & Engineering** | Refactor codebases, fix bugs, write tests, review PRs — on autopilot |
| **DevOps & Infra** | Monitor logs, rotate secrets, run health checks on a schedule |
| **Data & Research** | Scrape, analyze, summarize — agents that feed you insights daily |
| **B2B Outreach** | Personalized emails, LinkedIn research, lead enrichment — at scale |
| **Personal Productivity** | Organize files, draft emails, manage todos, track habits |
| **Content & Marketing** | Generate blog posts, social media, SEO audits — hands-free |

<br />

## What is this?

This repo is the **open-source local agent** for [V16](https://v16.ai) — autonomous AI agent orchestration that runs on your machine.

It connects to V16, receives orchestration commands, and gives AI agents access to your local environment: **filesystem, CLI tools, git, terminal, and more.** Your API keys never leave your machine.

```
  v16.ai  ════WebSocket════>  v16-agents (your machine)
                                   │
                                   ├─ Claude Code
                                   ├─ Codex
                                   ├─ Any CLI tool
                                   └─ Local filesystem, git, terminal
```

<br />

## What's inside

```
src/
├── cli/                 CLI commands (connect, login, run, agents, tools, status)
├── core/                Socket client, config, logger, command router
├── handlers/            Execution handlers, status reporting, tool runner
├── scheduler/           Cron-based agent scheduling, autonomous agent loop
├── templates/           Built-in agent templates (CloudWatch, more coming)
├── tools/
│   ├── adapters/        Tool adapters — Claude Code, Codex, generic CLI
│   ├── discovery.ts     Auto-detect installed CLI tools
│   └── registry.ts      Tool registry and capability mapping
└── types/               TypeScript type definitions
```

<br />

### Agent Definitions

Agents are defined with goals, schedules, and tool assignments. The V16 dashboard creates them; this runtime executes them.

> - Run on a **cron schedule** (e.g., every 30 minutes)
> - Use any **installed CLI tool** as its executor
> - Access the **local filesystem** and working directory
> - Stream output **in real-time** back to the dashboard
> - Be **paused, resumed, or triggered** remotely

### Tool Adapters

Built-in adapters for popular AI coding tools, plus a generic adapter for anything with a CLI:

| Adapter | Tool | Description |
|:--------|:-----|:------------|
| `claude-code` | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Anthropic's CLI coding agent |
| `codex` | [Codex CLI](https://github.com/openai/codex) | OpenAI's CLI coding agent |
| `generic` | Any CLI | Wrap any command-line tool as a V16 agent |

### Auto-Discovery

The agent automatically detects installed CLI tools on your machine and registers them as available executors. No configuration needed.

<br />

## Install

```bash
npm install -g v16.ai
```

## Quick Start

```bash
# 1. Login with your V16 token (from v16.ai/dashboard)
v16 login --token <your-token>

# 2. Connect to V16
v16 connect

# Done. Create and manage agents from the dashboard.
```

<br />

## Commands

| Command | Description |
|:--------|:------------|
| `v16 connect` | Connect to V16 and listen for commands |
| `v16 connect --dev` | Connect to local dev server |
| `v16 status` | Show connection status and installed tools |
| `v16 tools` | List detected CLI tools |
| `v16 run <tool> <prompt>` | Run a CLI tool locally |
| `v16 agents list` | List registered agents |
| `v16 agents create` | Create a new agent |
| `v16 agents remove` | Remove an agent |
| `v16 login --token` | Set your auth token |

<br />

## Architecture

```
                    ┌───────────────────────────┐
                    │                           │
                    │      V16 Cloud            │
                    │      v16.ai               │
                    │                           │
                    │   Dashboard  ·  API  ·    │
                    │   Scheduling · Alerts     │
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                            ◆ WebSocket ◆
                            (encrypted)
                                  │
  ┌───────────────────────────────┴───────────────────────────────┐
  │                                                               │
  │   Your Machine                                                │
  │                                                               │
  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
  │   │             │    │             │    │                 │  │
  │   │   Agent     │───▶│  Scheduler  │───▶│  Tool           │  │
  │   │   Runtime   │    │  (Cron)     │    │  Auto-discover  │  │
  │   │             │    │             │    │                 │  │
  │   └─────────────┘    └─────────────┘    └────────┬────────┘  │
  │                                                  │           │
  │   ┌──────────────────────────────────────────────┴────────┐  │
  │   │                                                       │  │
  │   │   Tool Adapters                                       │  │
  │   │                                                       │  │
  │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
  │   │   │ Claude Code │  │    Codex    │  │ Generic CLI │  │  │
  │   │   └─────────────┘  └─────────────┘  └─────────────┘  │  │
  │   │                                                       │  │
  │   └───────────────────────────────────────────────────────┘  │
  │                                                               │
  │   🔒  API keys, code, and data never leave this machine.     │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
```

<br />

## Design Principles

| | |
|:--|:--|
| **4 dependencies** | socket.io-client, commander, chalk, ora. Nothing else. |
| **No Docker, no VMs** | Pure JavaScript. Runs anywhere Node.js runs. |
| **BYOK** | Bring Your Own Keys. V16 orchestrates; your tools call the APIs. |
| **Lightweight daemon** | Single WebSocket, spawns subprocesses, streams output. |
| **Open source** | Agent definitions and tool adapters are fully open. Build your own. |

<br />

## Configuration

Config stored at `~/.v16/config.json`:

```json
{
  "serverUrl": "https://api.v16.ai",
  "token": "your-auth-token",
  "agents": []
}
```

<br />

## Requirements

- **Node.js 18+**
- At least one CLI tool installed (Claude Code, Codex, or any custom CLI)

<br />

## Contributing

PRs welcome. If you build a new tool adapter, we'd love to include it.

<br />

## Links

- **Platform** — [v16.ai](https://v16.ai)
- **Dashboard** — [v16.ai/dashboard](https://v16.ai/dashboard)
- **Issues** — [github.com/anup-singhai/v16-agents/issues](https://github.com/anup-singhai/v16-agents/issues)

<br />

## License

MIT

<br />

---

<p align="center">
  <sub>Built by <a href="https://v16.ai">V16</a> — your agents, your machine, your keys.</sub>
</p>
