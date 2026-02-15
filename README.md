<div align="center">
  <h1>🤖 V16 Client</h1>

  <h3>Ultra-Lightweight AI Agent for Your Computer</h3>

  <p>
    <img src="https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
    <img src="https://img.shields.io/badge/RAM-<50MB-green" alt="RAM">
    <img src="https://img.shields.io/badge/Startup-<2s-blue" alt="Startup">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  </p>

  <p>
    <a href="https://v16.ai">Website</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="CREDITS.md">Credits</a>
  </p>
</div>

---

## 🌟 What is V16 Client?

V16 Client is an **ultra-lightweight AI agent** that turns your computer into an intelligent assistant. With less than 50MB RAM usage and 2-second startup, it's 20x more efficient than traditional AI agents while providing more capabilities.

Connect to [v16.ai](https://v16.ai) to personalize your agent from anywhere, or run standalone with your own LLM provider.

### Key Highlights

- **🪶 Ultra-Lightweight**: <50MB RAM (vs 1GB+ for Node.js agents)
- **⚡ Lightning Fast**: 2-second startup
- **📦 Single Binary**: No Node.js, Python, or complex dependencies
- **🌍 Runs Anywhere**: From $10 boards to enterprise servers
- **🔌 Dual Mode**: Standalone OR connected to v16.ai platform

## 🚀 Quick Start

### 1. Download & Install

```bash
# Coming soon: One-line installer
curl -fsSL https://get.v16.ai | sh

# Or build from source
git clone https://github.com/v16ai/v16-client
cd v16-client
make build
make install
```

### 2. Initialize

```bash
v16 init
```

This creates `~/.v16/config.json` and workspace.

### 3. Configure Your LLM Provider

Edit `~/.v16/config.json`:

```json
{
  "agents": {
    "defaults": {
      "model": "gpt-4o"
    }
  },
  "providers": {
    "openai": {
      "api_key": "sk-..."
    }
  }
}
```

**Supported Providers** (14+): OpenAI, Anthropic, Gemini, Zhipu, Groq, DeepSeek, Moonshot, Nvidia, OpenRouter, local models (vLLM), and more!

### 4. Start Using

```bash
# One-off message
v16 chat -m "Write a Python script to analyze CSV files"

# Interactive mode
v16 chat

# Connect to v16.ai platform (coming soon)
v16 connect --token YOUR_TOKEN
```

## ✨ Features

### Core Capabilities

| Category | Features |
|----------|----------|
| **Desktop** | Screen capture, mouse/keyboard control, window management |
| **Browser** | Navigate, fill forms, extract data, screenshots (coming soon) |
| **Terminal** | Interactive shell sessions, command execution (coming soon) |
| **Files** | Read, write, edit, search (grep), pattern match (glob) |
| **Code** | Git operations, diff editing (enhanced tools coming soon) |
| **Web** | Search (Brave/DuckDuckGo), fetch content |
| **System** | Cron scheduling, task tracking |
| **Hardware** | I2C/SPI devices (Linux only) |

### AI Features

- **14+ LLM Providers**: Mix and match providers
- **Multi-Channel**: Telegram, Discord, Slack, WhatsApp, QQ, DingTalk, Feishu, LINE
- **Skills System**: Install and create custom skills
- **Memory**: Automatic context summarization
- **Scheduling**: Cron jobs and periodic tasks
- **Subagents**: Spawn async tasks in background

## 🎯 Use Cases

**Personal Productivity**
- Schedule and manage tasks
- Automate repetitive workflows
- Research and summarize information

**Software Development**
- Write and review code
- Run tests and create PRs
- Search codebases

**IoT & Embedded**
- Control sensors via I2C/SPI
- Run on $10 boards (LicheeRV-Nano, Raspberry Pi)
- Edge AI applications

**Server Management**
- Monitor health and logs
- Automated maintenance
- Alert handling

## 🏗️ Architecture

### Standalone Mode
Run locally with direct LLM access:
```
User → v16 chat → LLM Provider → Tools → Response
```

### Connected Mode (Coming Soon)
Connect to v16.ai for remote control:
```
v16.ai Dashboard → Socket.IO → v16 client → Tools → Response
```

**The Workflow:**
1. Visit [v16.ai](https://v16.ai) and sign up
2. Download v16 client (single binary)
3. Run `v16 connect --token <from dashboard>`
4. Personalize your agent via web interface
5. Agent executes locally with full system access

## 📊 Comparison

| Feature | Traditional Agents | V16 Client |
|---------|-------------------|------------|
| RAM Usage | 1GB+ | <50MB |
| Startup | 500s+ | <2s |
| Binary Size | 200MB+ | ~15MB |
| Dependencies | Node.js/Python | None |
| LLM Providers | 2-3 | 14+ |
| Channels | 1-2 | 11 |
| Hardware | Servers | $10+ boards |

## 🛠️ Building from Source

```bash
git clone https://github.com/v16ai/v16-client
cd v16-client

# Build
go build -o v16 ./cmd/v16

# Or use Make
make build

# Install
make install
```

## 🤝 Contributing

We welcome contributions!

- **Report bugs**: [GitHub Issues](https://github.com/v16ai/v16-client/issues)
- **Feature requests**: [Discussions](https://github.com/v16ai/v16-client/discussions)
- **Pull requests**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📜 License

MIT License - see [LICENSE](LICENSE)

### Attribution

V16 Client is based on [PicoClaw](https://github.com/sipeed/picoclaw) by Sipeed, which was inspired by [nanobot](https://github.com/HKUDS/nanobot) by HKUDS.

See [CREDITS.md](CREDITS.md) for full acknowledgments.

## 🔗 Links

- **Website**: [v16.ai](https://v16.ai)
- **GitHub**: [github.com/v16ai/v16-client](https://github.com/v16ai/v16-client)
- **Original PicoClaw**: [github.com/sipeed/picoclaw](https://github.com/sipeed/picoclaw)

---

<div align="center">
  <p>Built with ❤️ by the V16 community</p>
  <p>Based on PicoClaw | Inspired by nanobot</p>
</div>
