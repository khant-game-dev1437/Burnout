import { _decorator, Component } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { TeamMember } from './TeamMember';
import { TaskInfo } from './TaskData';

const { ccclass } = _decorator;

// ── Leadership Insights ────────────────────────────

interface Insight {
    trigger: string;
    message: string;
    shown: boolean;
}

const INSIGHTS: Insight[] = [
    { trigger: 'strengthMatch', message: '💡 Right person, right task = happy team.', shown: false },
    { trigger: 'weaknessMatch', message: '💡 Wrong fit drains morale fast.', shown: false },
    { trigger: 'firstBurnout', message: '💡 Burnout is preventable. Watch the signs.', shown: false },
    { trigger: 'firstDisengage', message: '💡 Ignored people check out.', shown: false },
    { trigger: 'overload', message: '💡 4+ tasks = diminishing returns.', shown: false },
    { trigger: 'oneOnOne', message: '💡 1-on-1s build trust. Time well spent.', shown: false },
    { trigger: 'delegateUp', message: '💡 Saying no protects your team.', shown: false },
    { trigger: 'bossInterrupt', message: '💡 Urgent ≠ important. Reprioritize.', shown: false },
    { trigger: 'wave5', message: '💡 Halfway! Pace yourself.', shown: false },
    { trigger: 'carryOver', message: '💡 Skipping low-priority tasks is okay.', shown: false },
];

@ccclass('InsightManager')
export class InsightManager extends Component {

    private strengthMatchCount: number = 0;
    private weaknessMatchCount: number = 0;

    start(): void {
        gameEvents.on(GameEvent.TASK_ASSIGNED, this.onTaskAssigned, this);
        gameEvents.on(GameEvent.MEMBER_BURNOUT, this.onBurnout, this);
        gameEvents.on(GameEvent.MEMBER_DISENGAGED, this.onDisengaged, this);
        gameEvents.on(GameEvent.ONE_ON_ONE, this.onOneOnOne, this);
        gameEvents.on(GameEvent.DELEGATE_UP, this.onDelegateUp, this);
        gameEvents.on(GameEvent.BOSS_INTERRUPT, this.onBossInterrupt, this);
        gameEvents.on(GameEvent.WAVE_STARTED, this.onWaveStarted, this);
        gameEvents.on(GameEvent.WAVE_ENDED, this.onWaveEnded, this);
        gameEvents.on(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    onDestroy(): void {
        gameEvents.off(GameEvent.TASK_ASSIGNED, this.onTaskAssigned, this);
        gameEvents.off(GameEvent.MEMBER_BURNOUT, this.onBurnout, this);
        gameEvents.off(GameEvent.MEMBER_DISENGAGED, this.onDisengaged, this);
        gameEvents.off(GameEvent.ONE_ON_ONE, this.onOneOnOne, this);
        gameEvents.off(GameEvent.DELEGATE_UP, this.onDelegateUp, this);
        gameEvents.off(GameEvent.BOSS_INTERRUPT, this.onBossInterrupt, this);
        gameEvents.off(GameEvent.WAVE_STARTED, this.onWaveStarted, this);
        gameEvents.off(GameEvent.WAVE_ENDED, this.onWaveEnded, this);
        gameEvents.off(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    private showInsight(trigger: string): void {
        const insight = INSIGHTS.find(i => i.trigger === trigger && !i.shown);
        if (!insight) return;
        insight.shown = true;

        // Delay so it doesn't compete with other messages
        this.scheduleOnce(() => {
            gameEvents.emit(GameEvent.CHAT_MESSAGE, insight.message, 'System');
        }, 4);
    }

    // ── Event Handlers ─────────────────────────────

    private onTaskAssigned(task: TaskInfo, member: TeamMember): void {
        if (task.skill === member.strength) {
            this.strengthMatchCount++;
            if (this.strengthMatchCount === 2) {
                this.showInsight('strengthMatch');
            }
        } else if (task.skill === member.weakness) {
            this.weaknessMatchCount++;
            if (this.weaknessMatchCount === 1) {
                this.showInsight('weaknessMatch');
            }
        }

        if (member.assignedTaskCount > 3) {
            this.showInsight('overload');
        }
    }

    private onBurnout(): void {
        this.showInsight('firstBurnout');
    }

    private onDisengaged(): void {
        this.showInsight('firstDisengage');
    }

    private onOneOnOne(): void {
        this.showInsight('oneOnOne');
    }

    private onDelegateUp(): void {
        this.showInsight('delegateUp');
    }

    private onBossInterrupt(): void {
        this.showInsight('bossInterrupt');
    }

    private onWaveStarted(wave: number): void {
        if (wave === 5) {
            this.showInsight('wave5');
        }
    }

    private onWaveEnded(wave: number): void {
        // Check if tasks carried over this wave
        this.showInsight('carryOver');
    }

    private onNewGame(): void {
        this.strengthMatchCount = 0;
        this.weaknessMatchCount = 0;
        for (const insight of INSIGHTS) {
            insight.shown = false;
        }
    }
}
