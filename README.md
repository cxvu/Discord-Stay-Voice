# Discord Stay Voice 24/7 Bot

A Discord bot that stays connected 24/7 to a voice channel with auto-rejoin and a Twitch streaming presence — no commands, no audio.

Built with **discord.js v14.27** and **@discordjs/voice v0.19**.

## Features

- Auto-joins the target voice channel as soon as the bot comes online.
- Joins with **mute OFF** and **deafen ON**.
- Auto-reconnects on real disconnects (not brief blips).
- Auto-rejoins if kicked, moved, or after a restart/crash.
- Static **Streaming (purple)** presence on Twitch.
- Colored console logging.

## Project Structure

```
/
├── src/
│   ├── index.js                  # Entry point
│   ├── config.js                 # Loads & validates env variables
│   ├── logger.js                 # Console logger
│   ├── voice.js                  # Stay-voice logic (join, reconnect)
│   ├── presence.js               # Twitch streaming presence
│   └── events/
│       ├── ready.js
│       └── voiceStateUpdate.js
├── .env.example             # Template — copy this to .env
├── .env                      # Your real config (never commit)
├── .gitignore
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

## Configuration

> **Important:** the bot reads from `.env`, not `.env.example`. Before running it, you must **rename `.env.example` to `.env`** first — if you skip this step, the bot won't start (it will complain about missing environment variables).

1. Rename `.env.example` to `.env`.
2. Fill in your own values:

```env
BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
VOICE_CHANNEL_ID=your_voice_channel_id_here

TWITCH_STREAM_NAME=Your Stream Name
TWITCH_STREAM_URL=https://twitch.tv/your_username
```

- **BOT_TOKEN** — from [Discord Developer Portal](https://discord.com/developers/applications) → your app → **Bot** → **Reset/Copy Token**. Never share it; reset it immediately if it's ever leaked.
- **GUILD_ID** — enable Developer Mode → right-click your server → **Copy Server ID**.
- **VOICE_CHANNEL_ID** — right-click the target voice channel → **Copy Channel ID**.
- **TWITCH_STREAM_NAME** / **TWITCH_STREAM_URL** — name & link for the Streaming presence. Leave both empty to skip it.

### Permissions & Intents

- Server permissions: `View Channel` + `Connect` on the target voice channel.
- Invite scope: just `bot` (no `applications.commands` needed).
- Intents used: `Guilds` and `GuildVoiceStates` (both non-privileged).

## Running

```bash
npm start
```

## How It Works

1. On `ready`, the bot joins `VOICE_CHANNEL_ID` with `selfMute: false`, `selfDeaf: true`.
2. If disconnected, it waits up to 30s to self-heal before manually rejoining — prevents flapping from brief blips.
3. A secondary listener catches kicks/moves and rejoins the target channel.
4. It won't create duplicate connections if already properly joined.
5. Streaming presence is set once on `ready`, using the Twitch info from `.env`.

## Notes

- Mute/deafen state is fixed in code (`src/voice.js`) — no command to change it.
- Streaming presence is static — edit `.env` and restart to change it.

## Deploying

- Startup command: `node src/index.js` or `npm start`.
- Set env vars via your host's panel, or use `.env`.
- No HTTP port needed — it's a background process only.
- 
