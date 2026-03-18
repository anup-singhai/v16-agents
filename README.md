<p align="center">
  <img src="https://v16.ai/logo.png" alt="V16" width="80" />
</p>

<h1 align="center">V16 Agents</h1>

<p align="center">
  <strong>Open-source agent definitions, tools, and local runtime for <a href="https://v16.ai">V16</a></strong>
</p>

<p align="center">
  <a href="https://v16.ai">Website</a> &middot;
  <a href="https://v16.ai/dashboard">Dashboard</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#architecture">Architecture</a>
</p>

---

## What is this?

This repo contains the **open-source local agent** for [V16](https://v16.ai) — the autonomous AI agent orchestration platform.

It runs on your machine, connects to V16 via WebSocket, and gives AI agents access to your local environment: filesystem, CLI tools, git, terminal, and more. **Your API keys never leave your machine.**

```
V16 Dashboard ───WebSocket───> v16-agents (your machine)
                                    │
                                    ├── Claude Code
                                    ├── Codex
                                    ├── Any CLI tool
                                    └── Local filesystem, git, terminal
```

## What's inside

```
src/
├── cli/                 # CLI commands (connect, login, run, agents, tools, status)
├── core/                # Socket client, config, logger, command router
├── handlers/            # Execution handlers, status reporting, tool runner
├── scheduler/           # Cron-based agent scheduling, autonomous agent loop
├── tools/
│   ├── adapters/        # Tool adapters (Claude Code, Codex, generic CLI)
│   ├── discovery.ts     # Auto-detect installed CLI tools
│   └── registry.ts      # Tool registry and capability mapping
└── types/               # TypeScript type definitions
```

### Agent Definitions

Agents are defined with goals, schedules, and tool assignments. The V16 dashboard creates them; this runtime executes them. Each agent can:

- Run on a **cron schedule** (e.g., every 30 minutes)
- Use any **installed CLI tool** as its executor
- Access the **local filesystem** and working directory
- Stream output **in real-time** back to the dashboard
- Be **paused, resumed, or triggered** from Telegram or the dashboard

### Tool Adapters

Built-in adapters for popular AI coding tools, plus a generic adapter for anything with a CLI:

| Adapter | Tool | What it does |
|---------|------|-------------|
| `claude-code` | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Anthropic's CLI coding agent |
| `codex` | [Codex CLI](https://github.com/openai/codex) | OpenAI's CLI coding agent |
| `generic` | Any CLI | Wrap any command-line tool as a V16 agent |

### Auto-Discovery

The agent automatically detects installed CLI tools on your machine and registers them as available executors. No manual configuration needed.

## Install

```bash
npm install -g v16.ai
```

## Quick Start

```bash
# 1. Login with your V16 token (get it from v16.ai/dashboard)
v16 login --token <your-token>

# 2. Connect to V16
v16 connect

# That's it. Create agents from the dashboard.
```

## Commands

| Command | Description |
|---------|-------------|
| `v16 connect` | Connect to V16 and listen for commands |
| `v16 connect --dev` | Connect to localhost:3001 (development) |
| `v16 status` | Show connection status and installed tools |
| `v16 tools` | List detected CLI tools |
| `v16 run <tool> <prompt>` | Run a CLI tool locally |
| `v16 agents list` | List registered agents |
| `v16 agents create` | Create a new agent |
| `v16 agents remove` | Remove an agent |
| `v16 login --token` | Set your auth token |

## Architecture

```
┌──────────────────────┐
│  V16 Cloud (v16.ai)  │
│                      │
│  Dashboard, API,     │
│  Notifications       │
│                      │
└──────────┬───────────┘
           │ WebSocket
           ▼
┌──────────────────────────────────────────────────┐
│  Your Machine (this repo)                        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Agent    │  │Scheduler │  │ Tool          │  │
│  │ Runtime  │──│ (Cron)   │──│ Auto-discover │  │
│  └──────────┘  └──────────┘  └───────┬───────┘  │
│                                      │           │
│  ┌───────────────────────────────────┼────────┐  │
│  │ Tool Adapters                     ▼        │  │
│  │ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │  │
│  │ │ Claude  │ │ Codex   │ │ Generic CLI  │  │  │
│  │ │ Code    │ │         │ │ (any tool)   │  │  │
│  │ └─────────┘ └─────────┘ └──────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  API keys, code, and data stay here. Always.     │
└──────────────────────────────────────────────────┘
```

## Design Principles

- **4 dependencies** — socket.io-client, commander, chalk, ora. No bloat.
- **No Docker, no VMs, no native modules** — pure JS, runs anywhere Node.js runs.
- **BYOK** — Bring Your Own Keys. V16 sends orchestration commands, your tools call the APIs directly.
- **Lightweight daemon** — single WebSocket connection, spawns subprocesses, streams output.
- **Open source** — agent definitions and tool adapters are fully open. Build your own.

## Configuration

Config stored at `~/.v16/config.json`:

```json
{
  "serverUrl": "https://api.v16.ai",
  "token": "your-auth-token",
  "agents": []
}
```

## Requirements

- Node.js 18+
- At least one CLI tool installed (claude, codex, or any custom CLI)

## Contributing

PRs welcome. If you build a new tool adapter, we'd love to include it.

## Links

- **Platform**: [v16.ai](https://v16.ai)
- **Dashboard**: [v16.ai/dashboard](https://v16.ai/dashboard)

## License

MIT
