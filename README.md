# Gurkirat Singh — Personal Site

Static portfolio site hosted on GitHub Pages, served at [gurkirat.net](https://gurkirat.net).
Plain HTML/CSS/JS — no build step, no frameworks, no CDN dependencies (Google Fonts excepted).

## Layout

- Hero with a live "currently building" status line
- **Now** — current milestone per project
- **What I build** — three lanes: desktop systems (C#), embedded (C++/RP2350), data & infrastructure (Java)
- **Projects** — Active builds (SpatialAudio, PicoTelemetry, MouseFlow) + Labs & demos
  (Voice Agent, Tic-Tac-Toe, OCR Translate, DeployBox) with status badges, expandable
  `<details>` deep dives, and a lane filter
- Skills, Experience, footer

## Projects Highlighted

- **SpatialAudio** — C#/.NET 8 desktop audio spatializer (WASAPI, Win32, from-scratch FFT + KEMAR HRTF)
- **PicoTelemetry** — RP2350/C++ bare-metal telemetry dashboard (ST7789, custom serial protocol)
- **MouseFlow** — Java telemetry capture; Kafka/Postgres pipeline in progress
- **Voice Agent** — zero-cloud voice assistant (Python, SSE, Vulkan/GGUF TTS) — lab, AI-assisted
- **Tic-Tac-Toe** — browser game with minimax AI + Cloudflare Workers multiplayer — playable
- **OCR Translate** — local AI manga translation (Python/Ollama) — live demo
- **DeployBox** — Go Docker CLI — lab, AI-assisted

## SEO / structured data

`index.html` carries JSON-LD (`Person` + `SoftwareSourceCode` list linking author to repos),
a canonical URL, and OpenGraph tags. `sitemap.xml` and `robots.txt` live at the root.

## Structure

```
├── index.html              Single page (sections + JSON-LD)
├── style.css               Design tokens + all styling
├── script.js               Nav, reveal, filters, dialog lightbox, OCR demo calls
├── sitemap.xml / robots.txt
├── js/
│   ├── config.js           Gitignored — TTT Worker URL
│   ├── tictactoe-engine.js Game logic (pure, zero DOM)
│   └── tictactoe-widget.js UI controller + multiplayer
├── css/
│   └── tictactoe.css       Game widget styles (token-based)
├── workers/
│   ├── multiplayer-worker.js Cloudflare Worker relay (Workers KV)
│   └── wrangler.toml         Deployment config
└── images/                 Project screenshots + demo video + favicon
```

## Running Locally

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy

Push to `main` → GitHub Pages auto-deploys → gurkirat.net.
