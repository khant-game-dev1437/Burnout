import { _decorator, Component, Node, Label, Button, Color } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { TeamMember } from './TeamMember';
import { TaskInfo } from './TaskData';
import { scoreColor, COLOR_RED, COLOR_YELLOW } from './GameConstants';

const { ccclass, property } = _decorator;

// ── Tracking Data ──────────────────────────────────

interface MemberStats {
    name: string;
    tasksAssigned: number;
    strengthMatches: number;
    weaknessMatches: number;
    burnedOut: boolean;
    disengaged: boolean;
    received1on1: boolean;
}

interface GameStats {
    totalTasksAssigned: number;
    totalTasksSkipped: number;
    strengthMatches: number;
    weaknessMatches: number;
    bossInterrupts: number;
    delegateUps: number;
    oneOnOnes: number;
    burnouts: number;
    disengagements: number;
    wavesCompleted: number;
    memberStats: Map<string, MemberStats>;
}

// ── Leadership Archetypes ──────────────────────────

interface Archetype {
    name: string;
    description: string;
    condition: (stats: GameStats) => boolean;
}

const ARCHETYPES: Archetype[] = [
    {
        name: 'The Burnout Factory',
        description: 'You pushed your team to the breaking point.',
        condition: (s) => s.burnouts >= 2,
    },
    {
        name: 'The Ghost Manager',
        description: 'Your team barely knew you were there.',
        condition: (s) => s.disengagements >= 2,
    },
    {
        name: 'The Micromanager',
        description: 'You dumped everything on one person.',
        condition: (s) => {
            const counts = [...s.memberStats.values()].map(m => m.tasksAssigned);
            const max = Math.max(...counts);
            const min = Math.min(...counts);
            return max - min >= 8;
        },
    },
    {
        name: 'The Empath',
        description: 'You cared about your people. It showed.',
        condition: (s) => s.oneOnOnes >= 3 && s.burnouts === 0,
    },
    {
        name: 'The Strategist',
        description: 'Right person, right task. Every time.',
        condition: (s) => s.strengthMatches >= s.totalTasksAssigned * 0.5,
    },
    {
        name: 'The Survivor',
        description: 'You made it through. Barely.',
        condition: (s) => s.wavesCompleted >= 10,
    },
    {
        name: 'The Overwhelmed Rookie',
        description: 'Every leader starts somewhere.',
        condition: () => true,
    },
];

// ── Team Feedback ──────────────────────────────────

function getMemberFeedback(stats: MemberStats): string {
    if (stats.burnedOut) return '"You broke me."';
    if (stats.disengaged) return '"You forgot I existed."';
    if (stats.tasksAssigned === 0) return '"I had nothing to do."';
    if (stats.weaknessMatches > stats.strengthMatches) return '"Wrong tasks, every time."';
    if (stats.strengthMatches >= 3) return '"You let me shine. Thanks."';
    if (stats.received1on1) return '"That chat meant a lot."';
    if (stats.tasksAssigned >= 6) return '"It was a LOT of work."';
    return '"It was okay, I guess."';
}

// ── ReportCard Component ───────────────────────────

@ccclass('ReportCard')
export class ReportCard extends Component {

    // Popup root — hide/show this node
    @property({ type: Node })
    popup: Node = null!;

    // Labels
    @property({ type: Label })
    lblTitle: Label = null!;

    @property({ type: Label })
    lblArchetype: Label = null!;

    @property({ type: Label })
    lblArchetypeDesc: Label = null!;

    @property({ type: Label })
    lblDelegation: Label = null!;

    @property({ type: Label })
    lblEmpathy: Label = null!;

    @property({ type: Label })
    lblPrioritization: Label = null!;

    @property({ type: Label })
    lblOverall: Label = null!;

    @property({ type: Label })
    lblFeedback1: Label = null!;

    @property({ type: Label })
    lblFeedback2: Label = null!;

    @property({ type: Label })
    lblFeedback3: Label = null!;

    @property({ type: Label })
    lblFeedback4: Label = null!;

    @property({ type: Button })
    btnPlayAgain: Button = null!;

    @property({ type: Node })
    gameManagerNode: Node = null!;

    private stats: GameStats = this.freshStats();

    start(): void {
        // Hide popup at start
        if (this.popup) this.popup.active = false;

        // Play again button
        if (this.btnPlayAgain) {
            this.btnPlayAgain.node.on('click', this.onPlayAgain, this);
        }

        gameEvents.on(GameEvent.TASK_ASSIGNED, this.onTaskAssigned, this);
        gameEvents.on(GameEvent.TASK_SKIPPED, this.onTaskSkipped, this);
        gameEvents.on(GameEvent.MEMBER_BURNOUT, this.onBurnout, this);
        gameEvents.on(GameEvent.MEMBER_DISENGAGED, this.onDisengaged, this);
        gameEvents.on(GameEvent.ONE_ON_ONE, this.onOneOnOne, this);
        gameEvents.on(GameEvent.DELEGATE_UP, this.onDelegateUp, this);
        gameEvents.on(GameEvent.BOSS_INTERRUPT, this.onBossInterrupt, this);
        gameEvents.on(GameEvent.WAVE_ENDED, this.onWaveEnded, this);
        gameEvents.on(GameEvent.GAME_OVER, this.onGameEnd, this);
        gameEvents.on(GameEvent.GAME_WON, this.onGameEnd, this);
        gameEvents.on(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    onDestroy(): void {
        gameEvents.off(GameEvent.TASK_ASSIGNED, this.onTaskAssigned, this);
        gameEvents.off(GameEvent.TASK_SKIPPED, this.onTaskSkipped, this);
        gameEvents.off(GameEvent.MEMBER_BURNOUT, this.onBurnout, this);
        gameEvents.off(GameEvent.MEMBER_DISENGAGED, this.onDisengaged, this);
        gameEvents.off(GameEvent.ONE_ON_ONE, this.onOneOnOne, this);
        gameEvents.off(GameEvent.DELEGATE_UP, this.onDelegateUp, this);
        gameEvents.off(GameEvent.BOSS_INTERRUPT, this.onBossInterrupt, this);
        gameEvents.off(GameEvent.WAVE_ENDED, this.onWaveEnded, this);
        gameEvents.off(GameEvent.GAME_OVER, this.onGameEnd, this);
        gameEvents.off(GameEvent.GAME_WON, this.onGameEnd, this);
        gameEvents.off(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    private freshStats(): GameStats {
        return {
            totalTasksAssigned: 0, totalTasksSkipped: 0,
            strengthMatches: 0, weaknessMatches: 0,
            bossInterrupts: 0, delegateUps: 0, oneOnOnes: 0,
            burnouts: 0, disengagements: 0, wavesCompleted: 0,
            memberStats: new Map(),
        };
    }

    private getMemberStat(name: string): MemberStats {
        if (!this.stats.memberStats.has(name)) {
            this.stats.memberStats.set(name, {
                name, tasksAssigned: 0, strengthMatches: 0, weaknessMatches: 0,
                burnedOut: false, disengaged: false, received1on1: false,
            });
        }
        return this.stats.memberStats.get(name)!;
    }

    // ── Event Tracking ─────────────────────────────

    private onTaskAssigned(task: TaskInfo, member: TeamMember): void {
        this.stats.totalTasksAssigned++;
        const ms = this.getMemberStat(member.displayName);
        ms.tasksAssigned++;
        if (task.skill === member.strength) { this.stats.strengthMatches++; ms.strengthMatches++; }
        else if (task.skill === member.weakness) { this.stats.weaknessMatches++; ms.weaknessMatches++; }
    }

    private onTaskSkipped(): void { this.stats.totalTasksSkipped++; }
    private onBurnout(member: TeamMember): void { this.stats.burnouts++; this.getMemberStat(member.displayName).burnedOut = true; }
    private onDisengaged(member: TeamMember): void { this.stats.disengagements++; this.getMemberStat(member.displayName).disengaged = true; }
    private onOneOnOne(member: TeamMember): void { this.stats.oneOnOnes++; this.getMemberStat(member.displayName).received1on1 = true; }
    private onDelegateUp(): void { this.stats.delegateUps++; }
    private onBossInterrupt(): void { this.stats.bossInterrupts++; }
    private onWaveEnded(): void { this.stats.wavesCompleted++; }

    // ── Show / Hide ────────────────────────────────

    private onGameEnd(): void {
        this.scheduleOnce(() => this.showPopup(), 1.5);
    }

    private showPopup(): void {
        if (!this.popup) return;

        const s = this.stats;
        const archetype = ARCHETYPES.find(a => a.condition(s))!;
        const delegation = this.getDelegationScore();
        const empathy = this.getEmpathyScore();
        const prioritization = this.getPrioritizationScore();
        const overall = Math.round((delegation + empathy + prioritization) / 3);

        // Archetype
        if (this.lblTitle) this.lblTitle.string = 'LEADERSHIP REPORT CARD';
        if (this.lblArchetype) this.lblArchetype.string = archetype.name;
        if (this.lblArchetypeDesc) this.lblArchetypeDesc.string = archetype.description;

        // Scores
        if (this.lblDelegation) {
            this.lblDelegation.string = `Delegation: ${delegation}/100`;
            this.lblDelegation.color = new Color(this.getScoreColor(delegation));
        }
        if (this.lblEmpathy) {
            this.lblEmpathy.string = `Empathy: ${empathy}/100`;
            this.lblEmpathy.color = new Color(this.getScoreColor(empathy));
        }
        if (this.lblPrioritization) {
            this.lblPrioritization.string = `Prioritization: ${prioritization}/100`;
            this.lblPrioritization.color = new Color(this.getScoreColor(prioritization));
        }
        if (this.lblOverall) {
            this.lblOverall.string = `Overall: ${overall}/100`;
            this.lblOverall.color = new Color(this.getScoreColor(overall));
        }

        // Team feedback
        const feedbackLabels = [this.lblFeedback1, this.lblFeedback2, this.lblFeedback3, this.lblFeedback4];
        const memberEntries = [...s.memberStats.values()];
        for (let i = 0; i < feedbackLabels.length; i++) {
            const lbl = feedbackLabels[i];
            if (!lbl) continue;
            if (i < memberEntries.length) {
                const ms = memberEntries[i];
                lbl.string = `${ms.name}: ${getMemberFeedback(ms)}`;
                lbl.color = new Color(ms.burnedOut ? COLOR_RED : ms.disengaged ? COLOR_YELLOW : '#FFFFFF');
            } else {
                lbl.string = '';
            }
        }

        this.popup.active = true;
        // Bring to front so it's above all other UI
        this.popup.setSiblingIndex(this.popup.parent!.children.length - 1);
    }

    private hidePopup(): void {
        if (this.popup) this.popup.active = false;
    }

    private onPlayAgain(): void {
        this.hidePopup();
        if (this.gameManagerNode) {
            const gm = this.gameManagerNode.getComponent('GameManager') as any;
            if (gm) gm.onNewGame();
        }
    }

    private getScoreColor(score: number): string {
        return scoreColor(score);
    }

    // ── Scoring ────────────────────────────────────

    private getDelegationScore(): number {
        const counts = [...this.stats.memberStats.values()].map(m => m.tasksAssigned);
        if (counts.length === 0 || this.stats.totalTasksAssigned === 0) return 0;
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
        return Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 15)));
    }

    private getEmpathyScore(): number {
        if (this.stats.totalTasksAssigned === 0) return 0;
        let score = 0;
        score += this.stats.oneOnOnes * 20;
        score += this.stats.strengthMatches * 5;
        score -= this.stats.burnouts * 25;
        score -= this.stats.disengagements * 20;
        score -= this.stats.weaknessMatches * 5;
        return Math.max(0, Math.min(100, score));
    }

    private getPrioritizationScore(): number {
        if (this.stats.totalTasksAssigned === 0) return 0;
        let score = 0;
        score += this.stats.delegateUps * 15;
        const total = this.stats.totalTasksAssigned + this.stats.totalTasksSkipped;
        if (total > 0) score += Math.round((this.stats.totalTasksAssigned / total) * 50);
        score += this.stats.wavesCompleted * 5;
        return Math.max(0, Math.min(100, score));
    }

    private onNewGame(): void {
        this.stats = this.freshStats();
        this.hidePopup();
    }
}
