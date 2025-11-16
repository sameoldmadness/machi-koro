# 🏙️ Machi Koro Game Engine

<div align="center">

A TypeScript-based game engine and AI strategy simulator for the popular city-building dice game [Machi Koro](https://en.wikipedia.org/wiki/Machi_Koro).

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![Tests](https://img.shields.io/badge/Tests-140%20passing-brightgreen)
![License](https://img.shields.io/badge/License-ISC-yellow)

[Features](#-features) • [Quick Start](#-quick-start) • [API](#-api-endpoints) • [Strategies](#-ai-strategies) • [Development](#-development)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Game Rules](#-game-rules)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [AI Strategies](#-ai-strategies)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Logging](#-logging)
- [Benchmarking](#-benchmarking)
- [Contributing](#-contributing)

---

## 🎯 Overview

This project implements a complete game engine for Machi Koro, featuring:
- **Full game mechanics** implementation with all cards and special abilities
- **Multiple AI strategies** for automated gameplay
- **OpenAI integration** for GPT-powered decision making
- **RESTful API** for external agent integration
- **Comprehensive logging** system with Winston
- **Extensive test coverage** (140+ tests)
- **Performance benchmarking** tools

Perfect for AI research, strategy development, or just enjoying automated Machi Koro tournaments!

## ✨ Features

### 🎮 Game Engine
- ✅ Complete Machi Koro rules implementation
- ✅ All 15 establishment cards with accurate mechanics
- ✅ 4 landmark cards (Terminal, Shopping Center, Amusement Park, Radio Tower)
- ✅ Special abilities (multipliers, stealing, card swapping)
- ✅ Multi-player support (2-4 players)

### 🤖 AI Strategies
- **Grain Strategy** - Focus on grain-based economy
- **Shop Strategy** - Bread and convenience store dominance
- **Cog Strategy** - Factory and gear production
- **OpenAI Strategy** - GPT-5 powered decision making with deep reasoning

### 🌐 RESTful API
- HTTP server for agent-based gameplay
- Support for external AI agents
- Game state inspection endpoints
- Real-time log streaming

### 📊 Advanced Features
- Winston-based logging (console, file, browser)
- Comprehensive test suite with Vitest
- Performance benchmarking tools
- TypeScript with strict type checking

---

## 🎲 Game Rules

Machi Koro is a city-building card game where players:
1. **Roll dice** (1 or 2 dice, depending on landmarks)
2. **Earn income** from establishments matching the roll
3. **Purchase cards** to build their city
4. **Win** by constructing all 4 landmark buildings

### Card Types

| Color | Type | Description |
|-------|------|-------------|
| 🔵 Blue | Primary Industry | Activates on **anyone's** turn |
| 🟢 Green | Secondary Industry | Activates on **your** turn only |
| 🔴 Red | Restaurants | Takes coins from **active player** |
| 🟣 Purple | Major Establishments | Special abilities on **your** turn |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- (Optional) OpenAI API key for GPT strategy

### Installation

```bash
# Clone the repository
git clone https://github.com/sameoldmadness/machi-koro.git
cd machi-koro

# Install dependencies
npm install

# Set up environment (for OpenAI strategy)
cp src/.env.example.ts src/.env.ts
# Edit src/.env.ts and add your OPENAI_API_KEY
```

### Running a Game

```bash
# Run a simple game simulation
npx tsx src/engine.ts

# Start the API server
npx tsx src/server.ts

# Run benchmarks (10,000 games)
npx tsx src/bench.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

---

## 🌐 API Endpoints

### Server Routes

#### `GET /server`
Runs a complete game simulation with default strategies.

**Response:**
```json
{
  "status": "ok",
  "time": "2025-11-16T18:00:00.000Z",
  "log": ["Game log entries..."]
}
```

#### `POST /server`
Send actions to the server.

**Request:**
```json
{
  "action": "roll",
  "payload": { "game": {...} }
}
```

#### `GET /logs`
Retrieve browser logs.

**Response:**
```json
{
  "logs": ["log entry 1", "log entry 2"],
  "count": 2
}
```

### Agent Routes

#### `GET /agent/:id`
Get agent status.

#### `POST /agent/:id`
Execute agent actions.

**Supported actions:**
- `roll` - Decide number of dice to roll
- `reroll` - Decide whether to reroll (Radio Tower)
- `buy` - Choose which card to purchase
- `swap` - Execute Business Center card swap

**Example:**
```bash
curl -X POST http://localhost:3000/agent/player1 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "buy",
    "payload": {
      "game": {...}
    }
  }'
```

---

## 🧠 AI Strategies

### Built-in Strategies

#### 🌾 Grain Strategy (`grainStrategy`)
Focuses on wheat-based economy:
1. Build 4x Grain Fields (1 coin on rolls of 1)
2. Acquire Terminal landmark (roll 2 dice)
3. Add 4x Fruit Markets (2 coins per grain on 11-12)
4. Complete with Apple Gardens

**Best for:** Consistent income, low-risk gameplay

#### 🏪 Shop Strategy (`shopStrategy`)
Convenience store dominance:
1. Maximize Shops (3 coins on roll of 2)
2. Get Shopping Center landmark (+1 to bread/coffee)
3. Focus on single-die rolls for consistency

**Best for:** Defensive play, stealing from active players

#### ⚙️ Cog Strategy (`cogStrategy`)
Industrial powerhouse:
1. Build 4x Forests (1 coin on roll of 5)
2. Get Terminal for 2-die advantage
3. Add 4x Furniture Factories (3 coins per cog on 8)
4. Scale with multiplier bonuses

**Best for:** Late game dominance, high-risk/high-reward

#### 🤖 OpenAI Strategy (`openaiStrategy`)
Uses GPT-5 with high reasoning effort:
- Analyzes full game state
- Considers top 10 Machi Koro strategies
- Makes context-aware decisions
- Adapts to opponent strategies

**Best for:** Experimental play, learning optimal strategies

### Creating Custom Strategies

```typescript
import { Strategy, State } from './game';

export const myStrategy: Strategy = {
  roll: async (game: State) => {
    // Return 1 or 2 dice
    return 1;
  },

  reroll: async (previousRoll: number, game: State) => {
    // Return number of dice or null
    return null;
  },

  buy: async (game: State) => {
    // Return card name or null to skip
    return 'Bakery';
  },

  swap: async (game: State) => {
    // Return swap details or null
    return null;
  }
};
```

---

## 📁 Project Structure

```
machi-koro/
├── src/
│   ├── game.ts           # Card definitions & game state types
│   ├── engine.ts         # Core game loop & mechanics
│   ├── strategy.ts       # AI strategy implementations
│   ├── openai.ts         # GPT-5 integration
│   ├── server.ts         # Express API server
│   ├── utils.ts          # Helper functions
│   ├── logger.ts         # Winston logging configuration
│   ├── bench.ts          # Performance benchmarking
│   └── *.test.ts         # Test suites (140+ tests)
├── logs/                 # Log files (git-ignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 🛠️ Development

### Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.9
- **Server:** Express 5.1
- **Testing:** Vitest 4.0
- **Logging:** Winston 3.18
- **AI:** OpenAI SDK 6.8
- **Code Quality:** ESLint, Prettier

### Environment Variables

```bash
# OpenAI API Key (required for openaiStrategy)
OPENAI_API_KEY=sk-...

# Server configuration
PORT=3000

# Logging levels
LOG_LEVEL=info          # debug, info, warn, error
CONSOLE_LOG_LEVEL=info
```

### Development Workflow

```bash
# Install dependencies
npm install

# Run type checking
npx tsc --noEmit

# Run linting
npx eslint src/

# Format code
npx prettier --write src/

# Run tests in watch mode
npm run test:watch

# Start dev server
npx tsx src/server.ts
```

---

## 🧪 Testing

### Test Coverage

- **140 tests** across 5 test suites
- **100% critical path coverage**
- Unit tests for all game mechanics
- Integration tests for API endpoints
- Strategy behavior validation

### Test Suites

```bash
✓ src/game.test.ts       (33 tests) - Card definitions
✓ src/utils.test.ts      (32 tests) - Helper functions
✓ src/engine.test.ts     (20 tests) - Game mechanics
✓ src/strategy.test.ts   (34 tests) - AI strategies
✓ src/server.test.ts     (21 tests) - API endpoints
```

### Running Specific Tests

```bash
# Run specific test file
npx vitest run src/engine.test.ts

# Run tests matching pattern
npx vitest run -t "should calculate income"

# Debug mode
npx vitest --inspect-brk
```

---

## 📝 Logging

### Log Outputs

1. **Console** - Concise, colored output for development
2. **File** - Extended JSON logs with daily rotation
3. **Browser** - Minimal in-memory logs for API access

### Log Levels

- `debug` - Strategy decisions, detailed game mechanics
- `info` - Game flow, player actions, purchases
- `warn` - Invalid moves, edge cases
- `error` - Exceptions, critical failures

### Log Files

```
logs/
├── machi-koro-2025-11-16.log       # All logs
└── machi-koro-error-2025-11-16.log # Errors only
```

### Accessing Logs

```bash
# Tail logs in real-time
tail -f logs/machi-koro-$(date +%Y-%m-%d).log

# Get logs via API
curl http://localhost:3000/logs
```

---

## ⚡ Benchmarking

Run large-scale simulations to test strategy performance:

```bash
npx tsx src/bench.ts
```

**Output:**
- Win rates for each strategy
- Performance statistics
- Game duration analysis

**Example results:**
```
Strategy Win Rates (10,000 games):
- Grain Strategy: 3,234 wins (32.34%)
- Shop Strategy:  3,891 wins (38.91%)
- Cog Strategy:   2,875 wins (28.75%)
```

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- 🎮 Additional game expansions (Harbor, Millionaire's Row)
- 🤖 New AI strategies
- 📊 Strategy analysis tools
- 🌐 Web UI for game visualization
- 🎯 Reinforcement learning integration

### Development Guidelines

1. Write tests for new features
2. Follow existing code style
3. Update documentation
4. Ensure all tests pass
5. Add debug logging for complex logic

---

## 📄 License

ISC License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Original Machi Koro game by Masao Suganuma
- OpenAI for GPT-5 reasoning capabilities
- The TypeScript and Node.js communities

---

<div align="center">

**Built with ❤️ and TypeScript**

[Report Bug](https://github.com/sameoldmadness/machi-koro/issues) • [Request Feature](https://github.com/sameoldmadness/machi-koro/issues)

</div>
