# v16.ai

Autonomous AI agent orchestration on your machine.

Run Claude Code, Codex, and any CLI tool as managed agents — scheduled, monitored, and coordinated from the V16 dashboard. Your machine, your API keys.

## Install

```bash
npm install -g v16.ai
```

## Setup

```bash
# 1. Login with your V16 token (get it from https://v16.ai/dashboard)
v16 login --token <your-token>

# 2. Connect to V16
v16 connect
```

## Commands

```
v16 connect          Connect to V16 and listen for commands
v16 connect --dev    Connect to localhost:3001 (development)
v16 status           Show connection status and installed tools
v16 tools            List detected CLI tools
v16 run <tool> <p>   Run a CLI tool locally (e.g. v16 run claude "fix the bug")
v16 agents list      List registered agents
v16 agents create    Create a new agent
v16 agents remove    Remove an agent
v16 login --token    Set your auth token
```

## How it works

1. **V16 dashboard** sends commands via WebSocket
2. **Local agent** spawns CLI tools (claude, codex, etc.) as subprocesses
3. **Output streams** back to the dashboard in real-time
4. **Scheduler** runs agents on cron schedules automatically

```
V16 Dashboard ──WebSocket──> Local Agent ──spawn──> Claude Code / Codex / Any CLI
                                  │
                                  └── streams stdout/stderr back to dashboard
```

## What it orchestrates

- **Claude Code** — Anthropic's CLI coding agent
- **Codex** — OpenAI's CLI coding agent
- **Any CLI tool** — custom tools detected automatically

## Key design decisions

- **4 dependencies** — socket.io-client, commander, chalk, ora. No bloat.
- **No Docker, no VMs, no native modules** — pure JavaScript, runs anywhere Node.js runs.
- **Your API keys stay local** — V16 sends prompts, your tools call the APIs directly.
- **Lightweight daemon** — connects via WebSocket, spawns subprocesses, streams output.

## Configuration

Config is stored at `~/.v16/config.json`:

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

## Links

- **Dashboard**: [v16.ai](https://v16.ai)
- **Docs**: [v16.ai/docs](https://v16.ai/docs)

## License

MIT
