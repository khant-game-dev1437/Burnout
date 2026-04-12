# Burnout Brigade — Corporate Training Mini-Game

> A leadership training game where every mechanic teaches you how to lead.

## What Is This?

You just got promoted to Department Head. Congratulations — now survive.

Tasks flood in every 20 seconds. You have 4 team members, each with unique strengths and weaknesses. The catch: **you can't do any tasks yourself**. You can only delegate.

Give someone too much work — they burn out. Ignore someone — they disengage. Mismatch tasks to skills — morale drops. There are always more tasks than your team can handle, so you must choose wisely.

Survive 10 waves. Keep your team alive. Learn what leadership actually means.

## Your Team

| Name | Strength | Weakness | Personality |
|------|----------|----------|-------------|
| **Min Khant** | Technical | Communication | Introvert — burns out fast under social tasks |
| **Leo** | Creative | Design | Enthusiastic — but needs variety |
| **Timber Saw** | Communication | Creative | People-person — hates being ignored |
| **Chris** | Design | Technical | Reliable and steady — slow to recover from overwork |

## How It Works

1. **Story Intro** — Typewriter-style intro explains the scenario
2. **10 Waves** — Each wave lasts 20 seconds, spawning 10 new tasks
3. **Drag & Drop** — Long-press (0.25s) a task card, drag it onto a team member
4. **Survive** — Keep at least 2 members active. 3+ down = game over
5. **Report Card** — End-game scoring with leadership archetype and team feedback

### Real-Time Mechanics
- **Morale drains continuously** (~2/sec) for all active members — the clock is always ticking
- **Energy recovers slowly** (~1.5/sec) — members recharge when idle
- **Unassigned tasks carry over** — pressure builds every wave
- **Boss interrupts** — urgent tasks drop mid-wave, forcing reprioritization
- **Random events** — "Leo brought donuts" or "the server went down"

### Skill Matching
Matching a task to a member's strength boosts morale. Mismatching drains it. The bonus scales with task difficulty:

| Difficulty | Stars | Energy Cost | Morale Boost (strength match) |
|-----------|-------|-------------|-------------------------------|
| Easy | 1 | 25 | +20 |
| Medium | 2 | 35 | +25 |
| Hard | 3 | 45 | +30 |

## Leadership Skills Taught Through Mechanics

| Mechanic | Leadership Skill |
|----------|-----------------|
| You cannot do tasks yourself | **Delegation** — leaders work through others |
| More tasks than capacity | **Prioritization** — choosing what NOT to do |
| Energy and morale tracking | **People awareness** — knowing your team's limits |
| Skill matching gives bonuses | **Strengths-based leadership** — right person, right task |
| Morale drains in real-time | **Urgency** — delayed decisions have consequences |
| Boss interrupts force reprioritization | **Adaptability** — handling pressure from above |

## Features

- **Typewriter story intro** — Sets the scene before gameplay starts
- **Wave-based timer system** — 10 rounds of increasing pressure
- **Long-press drag & drop** — 0.25s hold to grab, allows scrolling without accidental drags
- **Slack-style team chat** — Members react contextually to your decisions
- **Boss interrupts** — Urgent tasks appear mid-wave at the top of the list
- **Random morale events** — Positive and negative events keep you on your toes
- **Power-up potion** — Every 4 waves, restore all members' energy to max
- **Delegate Up** — Once per game, push back on a task
- **Leadership insights** — One-time contextual tips that connect mechanics to real leadership
- **Leadership Report Card** — End-game popup with scores, archetype, and team feedback
- **Play Again** — Restart from the report card screen

## Leadership Archetypes

Your play style determines your result:

- **The Strategist** — Right person, right task. Every time.
- **The Empath** — You cared about your people. It showed.
- **The Survivor** — You made it through. Barely.
- **The Micromanager** — You dumped everything on one person.
- **The Ghost Manager** — Your team barely knew you were there.
- **The Burnout Factory** — You pushed your team to the breaking point.
- **The Overwhelmed Rookie** — Every leader starts somewhere.

## Technical Architecture

### Why Event-Driven?

The game uses a **global event bus** (`GameEvents.ts`) instead of direct references between systems. This means:

- **ChatSystem** doesn't know about **GameManager** — it just listens for `TASK_ASSIGNED` and reacts
- **ReportCard** tracks stats by listening to events, without touching any game logic
- **InsightManager** can be removed entirely without breaking anything
- Adding a new feature (like BossEvent) only requires subscribing to existing events — zero changes to other files

This keeps systems **decoupled** and makes the codebase easy to extend.

### Why Singleton for AudioManager?

Audio needs to be accessible from anywhere (TaskCard plays click sounds, GameManager could play victory sounds). Instead of passing references through every component, `AudioManager.instance` provides global access with a single audio source.

### Key Design Decisions

- **Long-press to drag (0.25s)** — Without this, scrolling the task list would accidentally start dragging cards. The hold threshold lets touch events pass through to ScrollView for scrolling.
- **Real-time morale drain** — Instead of end-of-day calculations, morale drains every frame. This creates visible urgency — you can watch the bars drop. The `update(dt)` loop handles drain, energy recovery, and UI refresh at ~20fps for smooth bar animations.
- **Task cards destroyed on assign** — Cards are removed from the list immediately to keep it clean. No dimming, no scrolling past completed tasks.
- **Game over checked on state change, not per-frame** — `checkGameOver()` only runs when a member actually burns out or disengages, not every frame. Efficient and responsive.
- **Shared constants** (`GameConstants.ts`) — Skill names, colors, and member data defined once. No duplicate magic values across files.
- **All listeners cleaned up in `onDestroy()`** — Every component that subscribes to the event bus unsubscribes when destroyed. No memory leaks.
- **Tuning constants at file top** — Gameplay values (drain rate, energy cost, morale boost) are named constants, easy to find and adjust without touching logic.

### Project Structure

```
assets/
├── prefabs/
│   ├── chatItem.prefab     — Chat bubble prefab
│   ├── member.prefab       — Team member UI card
│   └── taskItem.prefab     — Draggable task card
├── scripts/
│   ├── GameManager.ts      — Wave timer, assignment logic, game flow
│   ├── GameEvents.ts       — Global event bus
│   ├── GameConstants.ts    — Shared constants (colors, names)
│   ├── GameAnimations.ts   — Tween helpers (bounce, shake)
│   ├── TeamMember.ts       — Member stats, skill matching, dialogs
│   ├── TeamSpawner.ts      — Spawns members, updates UI bars
│   ├── TaskData.ts         — Task pool and generation
│   ├── TaskCard.ts         — Long-press drag-and-drop component
│   ├── TaskSpawner.ts      — Spawns/manages task cards
│   ├── ChatSystem.ts       — Slack-style chat reactions
│   ├── ChatBubble.ts       — Individual chat bubble
│   ├── InsightManager.ts   — One-time leadership tips
│   ├── BossEvent.ts        — Boss interrupts & random events
│   ├── ReportCard.ts       — End-game scoring & feedback
│   ├── AudioManager.ts     — BGM & SFX (singleton)
│   └── StoryManager.ts     — Typewriter intro scene
```

## Tech Stack

- **Engine:** Cocos Creator 3.8.2 (2D)
- **Language:** TypeScript
- **Architecture:** Event-driven, component-based
- **Platform:** Web (HTML5)

## AI Tools

This project was developed with assistance from Claude (Anthropic) for code generation, architecture planning, and game design iteration. AI was used as a collaborative tool — all design decisions, creative direction, and implementation review were done by the developer.

## How to Run

1. Open the project in Cocos Creator 3.8.2
2. Open the main scene
3. Press Play

## Submission

- **For:** Gosu Academy — Game Developer Role (Round 2)
- **Brief:** Corporate Training Game Concept — Leadership Skills
- **Option:** B — Playable Mini-Game Demo
