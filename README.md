# 🥥 Coconut Bot

A Discord bot built with [discord.js v14](https://discord.js.org/) and hosted on Oracle Cloud. I made this as a personal project for my friend group's server. It includes a good amount of commands — covering everything from a full economy system to music playback and mini games. Others can easily run this bot on their personal server by following the **Getting started** section.

---

## Features

### 💰 Economy

A coconut-based currency system persisted with SQLite. Users can check balances, climb the leaderboard, and transfer funds between each other. Admin commands let you add, remove, or reset balances as needed.

### 🎉 Fun

- **Rob** — attempt to steal coconuts from another user; they get a timed window to accept or deny
- **Poll** — spin up a yes/no reaction poll with a configurable duration
- **Trivia** — answer questions pulled from the Open Trivia DB across 10 categories and 3 difficulty tiers, with coconut rewards on a correct answer
- **Roast** — AI roasts a target user using their profile, recent messages, and Steam library (if linked)
- **Compliment** — AI showers a user with personalised compliments using the same context as roast
- **Would You Rather** — AI generates a dilemma for the server to vote on; supports an optional theme and tracks live votes for 5 minutes
- **Chat** — send any message to the AI and get a response directly in the channel

### 🎮 Games

- **Blackjack** — full card game with bet wagering against a dealer
- **Hangman** — guess the hidden word one letter at a time for a coconut reward
- **Guessing Game** — pick a number 1–5 for a quick shot at winning coconuts
- **Random Steam Game** — pulls a random title from your Steam library when you can't decide what to play

### 🎵 Music

YouTube playback via `play-dl` with a persistent per-guild queue. Supports play, pause, resume, skip, stop, loop, shuffle, autoplay (YouTube recommendations), queue management, and an interactive button control panel.

### 🔧 Utility

- **Ping** — latency check
- **Choose** — randomly picks from a comma-separated list
- **Remind** — set a reminder up to 7 days out
- **Server / User** — server and user info cards
- **Help** — lists all commands and usage, filterable by category

---

## Documentation

Full command reference with descriptions and option details:
**[View Commands](https://your-docs-site.com/commands.html)** _(temporary link)_

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Discord application with a bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/jonehayd/discord_bot.git
cd discord_bot
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id
STEAM_API_KEY=your_steam_api_key
```

| Variable         | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `DISCORD_TOKEN`  | Your bot's token from the Developer Portal                        |
| `CLIENT_ID`      | The application ID (also from the Developer Portal)               |
| `GUILD_ID`       | The ID of the server to deploy slash commands to                  |
| `STEAM_API_KEY`  | Required for `/games random-steamgame`                            |
| `OPENAI_API_KEY` | Required for `/fun roast`, `compliment`, `wouldyourather`, `chat` |

### Running the Bot

```bash
node index.js
```

On startup the bot automatically deploys slash commands to the configured guild, then connects to Discord. No separate deploy step needed.

---

## Project Structure

```
commands/       # Slash commands organized by category
  economy/
  fun/
  games/
  music/
  utility/
core/           # Stateful managers (music player, rob state)
database/       # SQLite helpers (currency, Steam)
events/         # Discord event handlers
utils/          # Shared utilities (subcommand loader)
assets/         # Static assets
docs/           # Documentation page
```

Commands can be easily added by adding a new command folder with `index.js` as the parent command, and adding all subcommands in the same folder.

---
