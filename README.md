# Burnout Brigade — Corporate Training Mini-Game

> A leadership training game where every mechanic teaches you how to lead.

## What Is This?

You just got promoted to team lead at a tech company. Congratulations — now survive.

Tasks flood your inbox every morning. You have 4 team members, each with unique strengths, weaknesses, and personalities. The catch: **you can't do any tasks yourself**. You can only delegate.

Give someone too much work — they burn out. Ignore someone — they disengage. Mismatch tasks to skills — quality drops. There are always more tasks than your team can handle, so you must choose what to skip.

Survive 5 days. Keep your team alive. Learn what leadership actually means.

## Your Team

| Name | Strength | Weakness | Personality |
|------|----------|----------|-------------|
| **Alex** | Technical | Communication | Introvert — burns out fast under social tasks |
| **Sam** | Creative | Analytical | Enthusiastic — but needs variety or gets bored |
| **Jordan** | Communication | Technical | People-person — hates being ignored |
| **Riley** | Analytical | Creative | Reliable and steady — but crashes hard if overworked |

## How It Works

Each day follows this loop:

1. **Morning** — New tasks arrive in your inbox. Check your team's status.
2. **Assignment Phase** — Click a task, then click a team member to assign it. Match strengths for better results.
3. **End Day** — See how assignments played out. Energy and morale update.
4. **Evening Report** — What went well, what didn't, who's struggling.
5. **Leadership Insight** — A contextual tip based on the decisions you made.

After 5 days, you receive a **Leadership Report Card** with scores and a leadership archetype.

## Leadership Skills Taught Through Mechanics

| Mechanic | Leadership Skill |
|----------|-----------------|
| You cannot do tasks yourself | **Delegation** — leaders work through others |
| More tasks than capacity | **Prioritization** — choosing what NOT to do |
| Energy and morale tracking | **People awareness** — knowing your team's limits |
| Skill matching gives bonuses | **Strengths-based leadership** — right person, right task |
| Skipping low-priority tasks is valid | **Saying no** — protecting your team from overwork |
| 1-on-1 meetings cost a task slot | **Making time for people** — relationships over output |
| Boss interrupts force reprioritization | **Adaptability** — handling pressure from above |

## Features

- **Slack-style team chat** — Team members react to your decisions in real-time
- **Boss interrupts** — Urgent tasks drop mid-day from upper management
- **1-on-1 meetings** — Skip a task to have a conversation and boost morale
- **Push back** — Once per game, reject a task from your boss
- **Random events** — "Riley brought donuts" or "the coffee machine broke"
- **Burnout cascade** — If someone burns out, their tasks spill onto others
- **Leadership Report Card** — End-game scoring with archetype and team feedback

## Leadership Archetypes

Your play style determines your result:

- **The Strategist** — Balanced, thoughtful, effective
- **The Empath** — Team loves you, but not enough gets done
- **The Taskmaster** — Everything done, but at what cost?
- **The Micromanager** — Overloaded some, ignored others
- **The Burnout Factory** — Multiple people crashed under your leadership
- **The Rookie** — Still learning, and that's okay

## Tech Stack

- **Engine:** Cocos Creator 3.8.2 (2D)
- **Language:** TypeScript
- **UI:** Fully programmatic — no external art assets required
- **Platform:** Web (HTML5)

## AI Tools Note

This project was developed with assistance from Claude (Anthropic) for code generation, game design iteration, and architecture planning. AI was used as a collaborative tool — all design decisions, creative direction, and implementation review were done by the developer.

## How to Run

1. Open the project in Cocos Creator 3.8.2
2. Open the main scene
3. Attach `GameManager` component to the root Canvas node
4. Press Play

## Project Structure

```
assets/
└── scripts/
    ├── GameManager.ts      — Main game controller & state machine
    ├── TeamMember.ts       — Team member data & component
    ├── TaskData.ts         — Task types & generation
    ├── UIManager.ts        — Programmatic UI layout & updates
    ├── TaskCard.ts         — Individual task card component
    ├── ChatSystem.ts       — Slack-style team reactions
    ├── BossEvent.ts        — Boss interrupts & random events
    ├── InsightManager.ts   — Contextual leadership tips
    └── ReportCard.ts       — End-game leadership report card
```

## Submission

- **For:** Gosu Academy — Game Developer Role (Round 2)
- **Brief:** Corporate Training Game Concept — Leadership Skills
- **Option:** B — Playable Mini-Game Demo
