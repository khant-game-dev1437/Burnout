# Burnout Brigade — Corporate Training Mini-Game

## Project
- **Engine**: Cocos Creator 3.8.2 (2D)
- **Language**: TypeScript
- **Purpose**: Round 2 submission for Gosu Academy Game Developer role
- **Deadline**: April 14, 2026

## Game Concept
A leadership training mini-game where you play as a newly promoted team lead. Tasks flood in each wave — you drag-and-drop assign them to your 4 team members under time pressure. Each team member has unique skills, energy, and morale. Overload someone and they burn out. Ignore someone and they disengage.

## Leadership Skills Taught Through Mechanics
- **Delegation**: Player literally cannot do tasks — must assign to others
- **Prioritization**: More tasks than capacity — must triage
- **People awareness**: Must track energy/morale or face consequences
- **Strengths-based leadership**: Skill matching boosts morale (scales with difficulty); mismatches drain it
- **Saying no**: Delegate Up lets you push back on one task per game

## Team Members
| Name | Strength | Weakness | Trait |
|------|----------|----------|-------|
| Min Khant | Technical | Communication | Introverted, burns out fast under social tasks |
| Leo | Creative | Design | Enthusiastic but needs variety |
| Timber Saw | Communication | Creative | People-person, hates being ignored |
| Chris | Design | Technical | Steady, reliable, slow to recover from overwork |

## Core Loop — Wave System
1. **10 waves**, each lasting **20 seconds**
2. Each wave spawns **10 new tasks** (duplicates allowed)
3. Player long-presses (0.25s) then drags tasks onto team members
4. **Unassigned tasks carry over** to the next wave — pressure builds!
5. **All active members' morale drains in real-time** (~2/sec) — assigning strength-matched tasks is the only way to fight it
6. **Energy recovers slowly** in real-time (~1.5/sec) for active members
7. **Morale boost scales with difficulty**: diff1=+20, diff2=+25, diff3=+30
8. **Energy cost scales with difficulty**: diff1=20, diff2=30, diff3=40 (stars match difficulty)
9. **Power-up potion** every 4 waves — refills all active members' energy to max (player-activated)
10. **Disengaged members can't accept tasks** — card snaps back if dropped on them
11. **Game over triggers instantly** when 3+ members are down (burnout + disengaged combined)
12. Survive all 10 waves to win

## Features

### Chat System
- Slack-style chat bubbles — team members react contextually
- Reactions on task assignment (good match, bad match, overload)
- Wave start, burnout, disengagement reactions

### Boss Interrupts (BossEvent.ts)
- ~50% chance mid-wave (at 12s remaining) — urgent task appears at top of list
- Random morale events at 5s remaining (~35% chance) — positive or negative
- Events: "brought donuts", "had a conflict", "server went down", etc.

### Special Actions
- **Delegate Up**: Once per game, remove lowest-priority unassigned task
- **Power-up Potion**: Every 4 waves, player gets a potion to refill all members' energy to max

### Leadership Insights (InsightManager.ts)
- One-time contextual tips triggered by events (first burnout, strength match, overload, etc.)
- Short one-liners: "💡 Right person, right task = happy team."

### Leadership Report Card (ReportCard.ts)
- Popup on game over / victory
- **Delegation score**: How evenly tasks were spread (equal = 100, all to one = 0)
- **Empathy score**: % strength matches (up to 70) minus weakness mismatches and burnouts/disengagements
- **Prioritization score**: % tasks completed out of total possible (10/wave × waves + boss tasks)
- Leadership archetype: "The Strategist", "The Burnout Factory", "The Ghost Manager", etc.
- Team feedback: each member gives a one-line review of your leadership

### Audio (AudioManager.ts)
- Singleton pattern with static instance
- Background music (bgm) + SFX click on drag/drop
- All audio managed from one component

## Project Structure
```
assets/
├── prefabs/
│   ├── chatItem.prefab     — Chat bubble prefab
│   ├── member.prefab       — Team member UI prefab (with strength_weakness label)
│   └── taskItem.prefab     — Task card prefab
├── scripts/
│   ├── GameManager.ts      — Wave timer, assignment logic, game flow
│   ├── GameEvents.ts       — Global event bus (WAVE_STARTED, TASK_ASSIGNED, etc.)
│   ├── GameConstants.ts    — Shared constants (skill names, colors, member data)
│   ├── GameAnimations.ts   — Tween helpers (bounceIn, shake, waveTransition)
│   ├── TeamMember.ts       — Member component, stats, skill matching, dialogs
│   ├── TeamSpawner.ts      — Spawns 4 members, updates UI bars/mood
│   ├── TaskData.ts         — Task pool, generation, boss tasks
│   ├── TaskCard.ts         — Long-press drag-and-drop card component
│   ├── TaskSpawner.ts      — Spawns/manages task cards, hit detection
│   ├── ChatSystem.ts       — Slack-style reactions via event listeners
│   ├── ChatBubble.ts       — Individual chat bubble component
│   ├── InsightManager.ts   — One-time leadership tips
│   ├── BossEvent.ts        — Boss interrupts & random morale events
│   ├── ReportCard.ts       — End-game popup with scores & feedback
│   ├── AudioManager.ts     — BGM & SFX (singleton)
│   └── StoryManager.ts     — Typewriter intro + Start button
```

## Conventions
- All game logic in TypeScript components under `assets/scripts/`
- Event-driven architecture via `GameEvents.ts` — systems are decoupled
- Shared constants in `GameConstants.ts` — no duplicate magic values
- Gameplay tuning constants at top of `TeamMember.ts` (easy to adjust)
- All event listeners cleaned up in `onDestroy()`
- Prefabs for reusable UI elements (member, taskItem, chatItem)
- Long-press (0.25s) to drag tasks — allows scrolling without accidental drags
- AudioManager singleton for centralized sound management

## Evaluation Criteria (from brief)
1. Creativity and clarity — original, well-communicated, fun
2. Mechanic to learning connection — genuine, not bolted on
3. AI tool usage — effective and thoughtful
4. Execution quality — appropriate for time invested
