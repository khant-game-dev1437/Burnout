import { _decorator, Component, Node, Label } from 'cc';
import { TeamMember, SkillType } from './TeamMember';
import { TaskInfo } from './TaskData';
import { TaskSpawner } from './TaskSpawner';
import { TeamSpawner } from './TeamSpawner';
import { gameEvents, GameEvent } from './GameEvents';
import * as Anim from './GameAnimations';

const { ccclass, property } = _decorator;

enum GamePhase {
    WaveStart,
    Assignment,
    WaveEnd,
    GameOver,
    Victory,
}

const MAX_WAVES = 10;
const WAVE_DURATION = 20;           // seconds per wave
const TASKS_PER_WAVE = 10;
const MORALE_DRAIN_RATE = 2;        // morale lost per second for idle eager members
const ENERGY_RECOVERY_RATE = 1.5;   // energy recovered per second when not working
const UI_REFRESH_INTERVAL = 0.05;   // refresh member UI bars ~20fps for smooth drain

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: TaskSpawner })
    taskSpawner: TaskSpawner = null!;

    @property({ type: TeamSpawner })
    teamSpawner: TeamSpawner = null!;

    @property({ type: Label })
    lblWave: Label = null!;

    @property({ type: Label })
    lblPhase: Label = null!;

    @property({ type: Node })
    waveTransitionNode: Node = null!;

    @property({ type: Label })
    powerUpLabel: Label = null!;

    // State
    private currentWave: number = 0;
    private currentPhase: GamePhase = GamePhase.WaveStart;
    private selectedTask: TaskInfo | null = null;
    private delegateUpAvailable: boolean = true;
    private oneOnOneUsedThisWave: boolean = false;

    // Timer
    private waveTimer: number = 0;
    private isTimerRunning: boolean = false;
    private uiRefreshAccum: number = 0;

    // Got Powerup
    private powerUpCount: number = 0;

    start(): void {
        this.registerEvents();
        this.startWave();
    }

    onDestroy(): void {
        gameEvents.off(GameEvent.MEMBER_CLICKED, this.onMemberClicked, this);
    }

    // ── Timer Loop ─────────────────────────────────────

    update(dt: number): void {
        if (!this.isTimerRunning) return;

        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.waveTimer = 0;
            this.isTimerRunning = false;
            this.endWave();
            return;
        }

        // Update timer label
        this.updateTimerLabel();

        // Drain morale for eager idle members
        this.drainEagerMembers(dt);

        // Periodically refresh UI bars so drain is visible
        this.uiRefreshAccum += dt;
        if (this.uiRefreshAccum >= UI_REFRESH_INTERVAL) {
            this.uiRefreshAccum = 0;
            this.teamSpawner.refreshAll();
        }

        // Emit timer update event
        gameEvents.emit(GameEvent.TIMER_UPDATE, Math.ceil(this.waveTimer));
    }

    private updateTimerLabel(): void {
        if (!this.lblPhase) return;
        const secs = Math.ceil(this.waveTimer);
        this.lblPhase.string = `Assignment Phase - ${secs}s`;
    }

    private drainEagerMembers(dt: number): void {
        const members = this.teamSpawner.getMembers();
        for (const member of members) {
            if (member.burnedOut || member.disengaged) continue;

            // Drain morale for all active members
            const becameDisengaged = member.drainMorale(dt * MORALE_DRAIN_RATE);
            if (becameDisengaged) {
                gameEvents.emit(GameEvent.MEMBER_DISENGAGED, member);
                gameEvents.emit(GameEvent.CHAT_MESSAGE,
                    `${member.displayName} feels ignored and has disengaged...`, 'System');
            }

            // Slowly recover energy for all active members
            member.recoverEnergy(dt * ENERGY_RECOVERY_RATE);
        }
    }

    // ── Event Registration ──────────────────────────────

    private registerEvents(): void {
        // Task selected from task panel (click)
        this.taskSpawner.onTaskClicked = (task: TaskInfo) => {
            this.selectedTask = task;
            gameEvents.emit(GameEvent.TASK_SELECTED, task);
            gameEvents.emit(GameEvent.CHAT_MESSAGE, `Selected: "${task.title}" — click a team member to assign.`, 'System');
        };

        // Task dropped on member (drag & drop)
        this.taskSpawner.onTaskDroppedOnMember = (task: TaskInfo, member: TeamMember) => {
            if (this.currentPhase !== GamePhase.Assignment) return;
            if (task.assignedTo) return;
            if (!member.canWork()) {
                const reason = member.burnedOut ? 'burned out' : 'has no energy';
                gameEvents.emit(GameEvent.CHAT_MESSAGE, `${member.displayName} is ${reason} and can't work.`, 'System');
                return;
            }
            this.assignTask(task, member);
        };

        // Member clicked from team panel (click-to-assign fallback)
        gameEvents.on(GameEvent.MEMBER_CLICKED, this.onMemberClicked, this);
    }

    // ── Wave Flow ───────────────────────────────────────

    private startWave(): void {
        this.currentWave++;
        this.selectedTask = null;
        this.oneOnOneUsedThisWave = false;

        // Reset per-wave task counts on members
        const members = this.teamSpawner.getMembers();
        for (const m of members) {
            m.assignedTaskCount = 0;
        }

        // Update UI
        if (this.lblWave) this.lblWave.string = `Wave ${this.currentWave} / ${MAX_WAVES}`;

        // Transition animation or direct start
        if (this.waveTransitionNode) {
            Anim.waveTransition(this.waveTransitionNode, this.currentWave, () => {
                this.beginAssignmentPhase();
            });
        } else {
            this.beginAssignmentPhase();
        }
    }

    private usePowerUp(): void {
        if (this.powerUpCount <= 0) {
            return;
        }

        this.powerUpCount--;

        const members = this.teamSpawner.getMembers();
        for (const member of members) {
            if (!member.burnedOut && !member.disengaged) {
                member.energy = member.maxEnergy;
            }
        }

        gameEvents.emit(GameEvent.CHAT_MESSAGE, 'Power-up used! Team energy restored.', 'System');
        this.teamSpawner.refreshAll();

         this.powerUpLabel.string = this.powerUpCount.toString();
    }   

    private beginAssignmentPhase(): void {
        this.setPhase(GamePhase.Assignment);
        this.taskSpawner.spawnWaveTasks(TASKS_PER_WAVE);
        this.waveTimer = WAVE_DURATION;
        this.isTimerRunning = true;
        this.uiRefreshAccum = 0;
        this.updateTimerLabel();

        gameEvents.emit(GameEvent.WAVE_STARTED, this.currentWave);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, `Wave ${this.currentWave}: ${TASKS_PER_WAVE} new tasks incoming!`, 'System');

        if(this.currentWave % 2 == 0) {
            this.powerUpCount++;

            this.powerUpLabel.string = this.powerUpCount.toString();
        }
    }

    private endWave(): void {
        this.isTimerRunning = false;
        this.setPhase(GamePhase.WaveEnd);

        const members = this.teamSpawner.getMembers();
        const reportMessages: string[] = [];

        // Count unassigned tasks (they carry over)
        const unassigned = this.taskSpawner.getUnassignedTasks();
        if (unassigned.length > 0) {
            reportMessages.push(`${unassigned.length} task(s) carrying over to next wave.`);
        }

        // End-of-wave processing for each member (recovery, idle penalties)
        for (const member of members) {
            const msgs = member.endDay();
            reportMessages.push(...msgs);

            if (member.burnedOut) {
                gameEvents.emit(GameEvent.MEMBER_BURNOUT, member);
            }
            if (member.disengaged) {
                gameEvents.emit(GameEvent.MEMBER_DISENGAGED, member);
            }
        }

        // Refresh UI
        this.teamSpawner.refreshAll();

        // Check game over
        const burnedOutCount = members.filter(m => m.burnedOut).length;
        const disengagedCount = members.filter(m => m.disengaged).length;

        if (burnedOutCount >= 3) {
            this.gameOver('Too many team members burned out.');
            return;
        }
        if (disengagedCount >= 3) {
            this.gameOver('Too many team members disengaged.');
            return;
        }

        // Show report
        gameEvents.emit(GameEvent.SHOW_REPORT, reportMessages);
        gameEvents.emit(GameEvent.WAVE_ENDED, this.currentWave);

        // Check victory
        if (this.currentWave >= MAX_WAVES) {
            this.setPhase(GamePhase.Victory);
            gameEvents.emit(GameEvent.GAME_WON);
            gameEvents.emit(GameEvent.CHAT_MESSAGE, 'You survived all 10 waves! Great leadership!', 'System');
            return;
        }

        // Next wave after a short pause
        this.scheduleOnce(() => {
            this.startWave();
        }, 2);
    }

    private setPhase(phase: GamePhase): void {
        this.currentPhase = phase;
        const phaseNames = ['Wave Start', 'Assignment Phase', 'Wave End', 'Game Over', 'Victory'];
        if (this.lblPhase) this.lblPhase.string = phaseNames[phase];
        gameEvents.emit(GameEvent.PHASE_CHANGED, phaseNames[phase]);
    }

    // ── Assignment ──────────────────────────────────────

    private onMemberClicked(member: TeamMember): void {
        if (this.currentPhase !== GamePhase.Assignment) return;

        // No task selected — try 1-on-1
        if (!this.selectedTask) {
            if (!this.oneOnOneUsedThisWave) {
                this.doOneOnOne(member);
            } else {
                gameEvents.emit(GameEvent.CHAT_MESSAGE, 'Select a task first, or you already used your 1-on-1 this wave.', 'System');
            }
            return;
        }

        // Check if member can work
        if (!member.canWork()) {
            const reason = member.burnedOut ? 'burned out' : 'has no energy';
            gameEvents.emit(GameEvent.CHAT_MESSAGE, `${member.displayName} is ${reason} and can't work.`, 'System');
            return;
        }

        // Assign the task
        this.assignTask(this.selectedTask, member);
    }

    private assignTask(task: TaskInfo, member: TeamMember): void {
        const isGoodMatch = task.skill === member.strength;
        const isBadMatch = task.skill === member.weakness;

        const result = member.assignTask(task.skill, task.difficulty);
        member.totalTasksCompleted++;
        task.assignedTo = member.displayName;

        // Animate member reaction — shake only, no scaling
        if (member.burnedOut || isBadMatch) {
            Anim.shake(member.node, 8);
        }

        // Remove task card and update UI
        this.taskSpawner.markAssigned(task.id, member.displayName);
        this.teamSpawner.refreshAll();

        // Animate mood change
        Anim.animateMood(member.node, member.mood);

        // Emit events
        gameEvents.emit(GameEvent.TASK_ASSIGNED, task, member);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, result.message, member.displayName);

        if (member.burnedOut) {
            gameEvents.emit(GameEvent.MEMBER_BURNOUT, member);
        }
        if (member.disengaged) {
            gameEvents.emit(GameEvent.MEMBER_DISENGAGED, member);
        }

        // Clear selection
        this.selectedTask = null;
    }

    // ── Special Actions ─────────────────────────────────

    private doOneOnOne(member: TeamMember): void {
        this.oneOnOneUsedThisWave = true;
        const msg = member.oneOnOne();
        this.teamSpawner.refreshAll();

        gameEvents.emit(GameEvent.ONE_ON_ONE, member);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, msg, member.displayName);
    }

    public onDelegateUp(): void {
        if (!this.delegateUpAvailable) {
            gameEvents.emit(GameEvent.CHAT_MESSAGE, 'You already used your push back this game.', 'System');
            return;
        }

        const unassigned = this.taskSpawner.getUnassignedTasks();
        if (unassigned.length === 0) {
            gameEvents.emit(GameEvent.CHAT_MESSAGE, 'Nothing to push back on — all tasks are assigned.', 'System');
            return;
        }

        // Remove lowest priority unassigned task
        const sorted = unassigned.sort((a, b) => a.priority - b.priority);
        const removed = sorted[0];
        this.taskSpawner.removeTask(removed.id);
        this.delegateUpAvailable = false;

        gameEvents.emit(GameEvent.DELEGATE_UP, removed);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, `Pushed back: "${removed.title}" — removed from your plate.`, 'System');
    }

    // ── Game Over ───────────────────────────────────────

    private gameOver(reason: string): void {
        this.isTimerRunning = false;
        this.setPhase(GamePhase.GameOver);
        gameEvents.emit(GameEvent.GAME_OVER, reason);
        gameEvents.emit(GameEvent.CHAT_MESSAGE, `GAME OVER: ${reason}`, 'System');
    }

    public onNewGame(): void {
        this.currentWave = 0;
        this.delegateUpAvailable = true;
        this.selectedTask = null;
        this.isTimerRunning = false;
        this.waveTimer = 0;

        this.taskSpawner.reset();
        const members = this.teamSpawner.getMembers();
        for (const m of members) {
            m.resetForNewGame();
        }
        this.teamSpawner.refreshAll();

        gameEvents.emit(GameEvent.NEW_GAME);
        this.startWave();
    }
}
