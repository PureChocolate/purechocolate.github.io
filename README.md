# Gurkirat Singh — Personal Site

Static resume/portfolio site hosted on GitHub Pages, served at [gurkirat.net](https://gurkirat.net).

Dark theme, single-page layout with project deep-dives and an interactive tic-tac-toe widget.

## Projects Highlighted

- **MouseFlow** — Java system telemetry utility (Win32 API, JNA, JavaFX)
- **OCR Translate** — Local AI manga translation pipeline (Python, Ollama, Qwen3-VL)
- **DeployBox** — Go CLI for single-command Docker deployment
- **Tic-Tac-Toe** — Browser game with minimax AI and online PvP via Cloudflare Workers
- **Voice Agent** — Zero-cloud voice assistant for an AI coding agent (Python, SSE, WASAPI, S2/Kokoro TTS, Vulkan/GGUF on AMD)

## Structure

```
├── index.html              Single-page app
├── style.css               Main site styles
├── script.js               Scroll nav, OCR demo
├── js/
│   ├── tictactoe-engine.js Game logic (pure, zero DOM)
│   └── tictactoe-widget.js UI controller + multiplayer
├── css/
│   └── tictactoe.css       Game widget styles
├── workers/
│   ├── multiplayer-worker.js Cloudflare Worker relay (Workers KV)
│   └── wrangler.toml         Deployment config
└── images/                 Project screenshots + favicon
```

## Running Locally

```bash
python3 -m http.server 8080
# → http://localhost:8080
```