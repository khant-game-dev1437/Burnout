import { EventTarget } from 'cc';
import { TaskInfo } from './TaskData';
import { TeamMember } from './TeamMember';

// Global event bus — all systems communicate through this
export const gameEvents = new EventTarget();

// ── Event Names ─────────────────────────────────────

export const GameEvent = {
    // Wave flow
    WAVE_STARTED: 'wave-started',         // (wave: number)
    WAVE_ENDED: 'wave-ended',             // (wave: number)
    TIMER_UPDATE: 'timer-update',         // (secondsLeft: number)
    PHASE_CHANGED: 'phase-changed',       // (phase: string)

    // Task events
    TASK_SELECTED: 'task-selected',       // (task: TaskInfo)
    TASK_ASSIGNED: 'task-assigned',       // (task: TaskInfo, member: TeamMember)
    TASK_SKIPPED: 'task-skipped',         // (task: TaskInfo)

    // Member events
    MEMBER_CLICKED: 'member-clicked',     // (member: TeamMember)
    MEMBER_BURNOUT: 'member-burnout',     // (member: TeamMember)
    MEMBER_DISENGAGED: 'member-disengaged', // (member: TeamMember)
    MEMBER_RECOVERED: 'member-recovered', // (member: TeamMember)

    // Special actions
    ONE_ON_ONE: 'one-on-one',             // (member: TeamMember)
    DELEGATE_UP: 'delegate-up',           // (task: TaskInfo)
    BOSS_INTERRUPT: 'boss-interrupt',     // (task: TaskInfo)

    // Game state
    GAME_OVER: 'game-over',               // (reason: string)
    GAME_WON: 'game-won',                 // ()
    NEW_GAME: 'new-game',                 // ()

    // UI
    SHOW_REPORT: 'show-report',           // (messages: string[])
    SHOW_INSIGHT: 'show-insight',         // (insight: object)
    CHAT_MESSAGE: 'chat-message',         // (message: string, sender: string)
};
