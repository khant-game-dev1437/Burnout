# Burnout Brigade — Corporate Training Mini-Game

## Project
- **Engine**: Cocos Creator 3.8.2 (2D)
- **Language**: TypeScript
- **Purpose**: Round 2 submission for Gosu Academy Game Developer role
- **Deadline**: April 14, 2026

## Game Concept
A leadership training mini-game where you play as a newly promoted team lead. Tasks flood in each day — you assign them to your 4 team members. You cannot do tasks yourself. Each team member has unique skills, energy, and morale. Overload someone and they burn out. Ignore someone and they disengage.

## Leadership Skills Taught Through Mechanics
- **Delegation**: Player literally cannot do tasks — must assign to others
- **Prioritization**: More tasks than capacity — must triage
- **People awareness**: Must track energy/morale or face consequences
- **Strengths-based leadership**: Skill matching gives bonuses; mismatches punish
- **Saying no**: Skipping low-priority tasks is sometimes the right call

## Team Members
| Name | Strength | Weakness | Trait |
|------|----------|----------|-------|
| Min Khant | Technical | Communication | Introverted, burns out fast under social tasks |
| Leo | Creative | Analytical | Enthusiastic but needs variety |
| Timber Saw | Communication | Technical | People-person, hates being ignored |
| Chris | Analytical | Creative | Steady, reliable, slow to recover from overwork |

## Core Loop — Wave System
1. **10 waves**, each lasting **20 seconds**
2. Each wave spawns **10 new tasks** (duplicates allowed)
3. Player drags/clicks tasks onto team members before timer runs out
4. **Unassigned tasks carry over** to the next wave — pressure builds!
5. **Eager idle members' morale drains in real-time** (~2/sec) if not assigned work
6. Between waves — brief recovery (energy +20, morale +5 if low)
7. Survive all 10 waves to win. 3+ burnouts or 3+ disengagements = game over

## Creative Features

### Chat System
- Slack-style chat bubbles — team members react contextually
- Examples: "Alex: ...I'll try, but I'm exhausted" / "Jordan: Why does Sam get all the fun stuff?"
- Reactions appear during assignment phase and in evening reports

### Boss Interrupts
- Random urgent tasks mid-assignment ("CEO needs this NOW")
- Forces reprioritization — teaches adaptability under pressure
- Cannot be skipped — must be assigned or suffer team-wide morale penalty

### Special Actions (limited uses)
- **1-on-1 Meeting**: Spend a task slot to skip a task but boost someone's morale (teaches: making time for people)
- **Delegate Up**: Once per game, push back on your boss to remove a task (teaches: saying no to leadership)
- **Team Pair-Up**: Assign two members to one task for bonus quality, but uses two slots

### Dynamic Events
- **Burnout Cascade**: If someone burns out, their unfinished tasks spill onto others next day
- **Random Morale Events**: "Riley brought donuts" (+morale all), "Alex and Jordan had a conflict" — uncontrollable events you must respond to

### Leadership Report Card (End Game)
- Score breakdown: Delegation Style, Empathy Rating, Prioritization Skill
- Leadership archetype result: "The Micromanager", "The Empath", "The Strategist", "The Burnout Factory"
- Team feedback quotes — each member gives a fake performance review of YOU based on how you treated them

### Visual Polish (no external assets)
- Color-coded task urgency: green → yellow → red (pulsing)
- Emoji-style mood indicators on team members
- Day/night background color shift per phase

## Project Structure
```
assets/
├── prefabs/
│   ├── chatItem.prefab     — Chat bubble prefab
│   ├── member.prefab       — Team member UI prefab
│   └── taskItem.prefab     — Task card prefab
├── scripts/
│   ├── GameManager.ts      — Main game controller, state machine (✅ done)
│   ├── GameEvents.ts       — Global event bus, 16 event types (✅ done)
│   ├── GameAnimations.ts   — 14 tween-based animation helpers (✅ done)
│   ├── TeamMember.ts       — Team member component & data (✅ done)
│   ├── TeamSpawner.ts      — Spawns 4 members, updates UI bars/mood (✅ done)
│   ├── TaskData.ts         — Task generation, pool & types (✅ done)
│   ├── TaskCard.ts         — Drag-and-drop task card component (✅ done)
│   ├── TaskSpawner.ts      — Spawns/manages task cards, hit detection (✅ done)
│   ├── ChatSystem.ts       — Slack-style team member reactions (✅ done)
│   ├── ChatBubble.ts       — Individual chat bubble component (✅ done)
│   ├── InsightManager.ts   — Leadership insight messages (✅ done)
│   ├── BossEvent.ts        — Boss interrupts & random events (✅ done)
│   ├── ReportCard.ts       — End-game leadership report card (✅ done)
│   └── AudioManager.ts     — Background music & SFX (✅ done)
```

## Conventions
- All game logic in TypeScript components under `assets/scripts/`
- UI built programmatically (no manual scene setup beyond root node)
- Cocos Creator 3.x API (cc module imports)
- Event-driven architecture via `GameEvents.ts` event bus
- Prefabs for reusable UI elements (member, taskItem, chatItem)
- Drag-and-drop task assignment (drag card onto team member)

## Evaluation Criteria (from brief)
1. Creativity and clarity — original, well-communicated, fun
2. Mechanic to learning connection — genuine, not bolted on
3. AI tool usage — effective and thoughtful
4. Execution quality — appropriate for time invested
