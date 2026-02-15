# Credits

V16 Client stands on the shoulders of giants. We are deeply grateful to the open-source community for making this project possible.

## PicoClaw

V16 Client is a fork of **[PicoClaw](https://github.com/sipeed/picoclaw)** by Sipeed. We extend our sincere gratitude to the PicoClaw team for their groundbreaking work in creating an ultra-lightweight AI agent architecture.

**Key contributions from PicoClaw:**
- Ultra-efficient agent loop architecture (<10MB RAM footprint)
- Multi-provider LLM support (14+ providers including OpenAI, Anthropic, Gemini, local models)
- Hardware integration tools (I2C/SPI for IoT devices)
- Multi-channel communication architecture (Telegram, Discord, Slack, WhatsApp, and more)
- Skills system with 3-tier hierarchy
- Cron scheduler for recurring tasks
- Heartbeat system for autonomous periodic execution
- Subagent/spawn capabilities for async task handling
- Memory management with automatic summarization
- Security sandbox with workspace restrictions

## nanobot

PicoClaw itself was inspired by **[nanobot](https://github.com/HKUDS/nanobot)** by HKUDS, which pioneered the concept of lightweight AI agents with minimal resource requirements.

**Key concepts from nanobot:**
- Lightweight agent architecture
- Tool-based interaction model
- Efficient context management

## V16 Enhancements

V16 Client extends the PicoClaw foundation with additional capabilities:

- **Desktop Control**: Screen capture, mouse/keyboard automation
- **Browser Automation**: Headless browser control with session persistence
- **Terminal/PTY**: Interactive shell sessions
- **Enhanced Editing**: Diff-based file editing
- **Code Search**: Fast grep and glob pattern matching
- **Git Integration**: Automated git operations, PR creation
- **Task Tracking**: TodoWrite system for progress monitoring
- **V16 Platform Integration**: Socket.IO connector for v16.ai backend

## Open Source Dependencies

V16 Client relies on numerous excellent open-source libraries. See `go.mod` for the complete list. Notable dependencies include:

- **Anthropic SDK**: Official Anthropic API client
- **OpenAI SDK**: Official OpenAI API client
- **GitHub Copilot SDK**: GitHub Copilot integration
- **chromedp**: Chrome DevTools Protocol for browser automation
- **robotgo**: Cross-platform desktop automation
- **go-socket.io**: WebSocket communication
- **And many more...**

## Contributors

Thank you to all V16 Client contributors who have helped improve this project:

[Contributors list will auto-populate via GitHub]

## How to Contribute

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

---

**License**: MIT License (see [LICENSE](LICENSE))

**Project**: https://github.com/v16ai/v16-client

**Website**: https://v16.ai

**Community**: https://discord.gg/v16ai
