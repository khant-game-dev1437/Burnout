import { _decorator, Component } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { TaskSpawner } from './TaskSpawner';
import { TeamSpawner } from './TeamSpawner';
import { generateBossTask } from './TaskData';

const { ccclass, property } = _decorator;

// ── Random Morale Events ───────────────────────────

interface MoraleEvent {
    message: string;
    moraleChange: number;      // applied to all members
    energyChange: number;      // applied to all members
    targetOne: boolean;        // true = affects one random member, false = all
}

const POSITIVE_EVENTS: MoraleEvent[] = [
    { message: '{name} brought donuts for the team!', moraleChange: 10, energyChange: 5, targetOne: false },
    { message: 'The team got a shoutout from the CEO!', moraleChange: 15, energyChange: 0, targetOne: false },
    { message: '{name} told a hilarious joke — everyone laughed.', moraleChange: 8, energyChange: 0, targetOne: false },
    { message: '{name} got a great performance review!', moraleChange: 20, energyChange: 0, targetOne: true },
];

const NEGATIVE_EVENTS: MoraleEvent[] = [
    { message: '{name} and {name2} had a conflict...', moraleChange: -10, energyChange: 0, targetOne: false },
    { message: 'Server went down — everyone is stressed.', moraleChange: -8, energyChange: -10, targetOne: false },
    { message: '{name} got harsh feedback from a client.', moraleChange: -15, energyChange: 0, targetOne: true },
    { message: 'Mandatory all-hands meeting killed the vibe.', moraleChange: -5, energyChange: -5, targetOne: false },
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── BossEvent Component ────────────────────────────

@ccclass('BossEvent')
export class BossEvent extends Component {

    @property({ type: TaskSpawner })
    taskSpawner: TaskSpawner = null!;

    @property({ type: TeamSpawner })
    teamSpawner: TeamSpawner = null!;

    private bossInterruptUsedThisWave: boolean = false;
    private randomEventUsedThisWave: boolean = false;
    private lastCheckedSecond: number = -1;

    start(): void {
        gameEvents.on(GameEvent.WAVE_STARTED, this.onWaveStarted, this);
        gameEvents.on(GameEvent.TIMER_UPDATE, this.onTimerUpdate, this);
        gameEvents.on(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    private onWaveStarted(wave: number): void {
        this.bossInterruptUsedThisWave = false;
        this.randomEventUsedThisWave = false;
        this.lastCheckedSecond = -1;
    }

    private onTimerUpdate(secondsLeft: number): void {
        // Only process once per second
        if (secondsLeft === this.lastCheckedSecond) return;
        this.lastCheckedSecond = secondsLeft;

        // Boss interrupt: triggers once at 12s remaining, 50% chance
        if (!this.bossInterruptUsedThisWave && secondsLeft === 12) {
            this.bossInterruptUsedThisWave = true;
            if (Math.random() < 0.5) {
                this.triggerBossInterrupt();
            }
        }

        // Random morale event: triggers once at 5s remaining, 35% chance (not same wave as boss)
        if (!this.randomEventUsedThisWave && secondsLeft === 5) {
            this.randomEventUsedThisWave = true;
            if (!this.bossInterruptUsedThisWave || Math.random() < 0.2) {
                if (Math.random() < 0.35) {
                    this.triggerRandomEvent();
                }
            }
        }
    }

    private triggerBossInterrupt(): void {
        this.bossInterruptUsedThisWave = true;

        const task = generateBossTask();
        this.taskSpawner.addBossTask(task);

        gameEvents.emit(GameEvent.BOSS_INTERRUPT, task);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, `BOSS: "Drop everything. ${task.title} — NOW."`, 'System');
    }

    private triggerRandomEvent(): void {
        const members = this.teamSpawner.getMembers();
        const activeMembers = members.filter(m => !m.burnedOut && !m.disengaged);
        if (activeMembers.length === 0) return;

        const isPositive = Math.random() < 0.5;
        const event = isPositive ? pickRandom(POSITIVE_EVENTS) : pickRandom(NEGATIVE_EVENTS);

        const target = pickRandom(activeMembers);
        let target2 = target;
        if (activeMembers.length > 1) {
            do { target2 = pickRandom(activeMembers); } while (target2 === target);
        }

        // Format message
        let msg = event.message
            .replace('{name}', target.displayName)
            .replace('{name2}', target2.displayName);

        // Apply effects
        if (event.targetOne) {
            target.morale = Math.max(0, Math.min(100, target.morale + event.moraleChange));
            target.energy = Math.max(0, Math.min(100, target.energy + event.energyChange));
        } else {
            for (const m of activeMembers) {
                m.morale = Math.max(0, Math.min(100, m.morale + event.moraleChange));
                m.energy = Math.max(0, Math.min(100, m.energy + event.energyChange));
            }
        }

        this.teamSpawner.refreshAll();
        gameEvents.emit(GameEvent.CHAT_MESSAGE, msg, 'System');
    }

    private onNewGame(): void {
        this.bossInterruptUsedThisWave = false;
    }
}
