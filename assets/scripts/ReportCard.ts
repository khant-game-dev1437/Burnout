import { _decorator, Component, Node, Label, Sprite, Color, UITransform, Widget, find, Size, tween, Vec3 } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { TeamMember } from './TeamMember';
import { TaskInfo } from './TaskData';

const { ccclass } = _decorator;

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
    if (stats.burnedOut) return `"You broke me."`;
    if (stats.disengaged) return `"You forgot I existed."`;
    if (stats.tasksAssigned === 0) return `"I had nothing to do."`;
    if (stats.weaknessMatches > stats.strengthMatches) return `"Wrong tasks, every time."`;
    if (stats.strengthMatches >= 3) return `"You let me shine. Thanks."`;
    if (stats.received1on1) return `"That chat meant a lot."`;
    if (stats.tasksAssigned >= 6) return `"It was a LOT of work."`;
    return `"It was okay, I guess."`;
}

// ── ReportCard Component ───────────────────────────

@ccclass('ReportCard')
export class ReportCard extends Component {

    private stats: GameStats = this.freshStats();
    private popupNode: Node | null = null;

    start(): void {
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

    // ── Popup UI ───────────────────────────────────

    private onGameEnd(): void {
        this.scheduleOnce(() => this.showPopup(), 1.5);
    }

    private showPopup(): void {
        const canvas = find('Canvas');
        if (!canvas) return;

        const s = this.stats;
        const archetype = ARCHETYPES.find(a => a.condition(s))!;
        const delegation = this.getDelegationScore();
        const empathy = this.getEmpathyScore();
        const prioritization = this.getPrioritizationScore();
        const overall = Math.round((delegation + empathy + prioritization) / 3);

        // ── Overlay (dim background)
        const overlay = new Node('ReportOverlay');
        canvas.addChild(overlay);
        const overlaySprite = overlay.addComponent(Sprite);
        overlaySprite.color = new Color(0, 0, 0, 180);
        overlaySprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const overlayTransform = overlay.getComponent(UITransform)!;
        overlayTransform.contentSize = new Size(2000, 2000);
        const overlayWidget = overlay.addComponent(Widget);
        overlayWidget.isAlignTop = true;
        overlayWidget.isAlignBottom = true;
        overlayWidget.isAlignLeft = true;
        overlayWidget.isAlignRight = true;
        overlayWidget.top = 0; overlayWidget.bottom = 0;
        overlayWidget.left = 0; overlayWidget.right = 0;

        // ── Popup container
        const popup = new Node('ReportPopup');
        overlay.addChild(popup);
        const popupTransform = popup.addComponent(UITransform);
        popupTransform.contentSize = new Size(500, 550);
        const popupBg = popup.addComponent(Sprite);
        popupBg.color = new Color(30, 30, 46, 240);
        popupBg.sizeMode = Sprite.SizeMode.CUSTOM;

        // Animate popup scale in
        popup.setScale(new Vec3(0, 0, 1));
        tween(popup).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();

        let yPos = 230;

        // ── Title
        yPos = this.addLabel(popup, 'LEADERSHIP REPORT CARD', 28, '#FFFFFF', yPos);
        yPos -= 15;

        // ── Archetype
        yPos = this.addLabel(popup, `"${archetype.name}"`, 24, '#F1C40F', yPos);
        yPos = this.addLabel(popup, archetype.description, 16, '#BBBBBB', yPos);
        yPos -= 15;

        // ── Scores
        yPos = this.addLabel(popup, '── Scores ──', 18, '#FFFFFF', yPos);
        yPos = this.addLabel(popup, `Delegation: ${delegation}/100`, 16, this.scoreColor(delegation), yPos);
        yPos = this.addLabel(popup, `Empathy: ${empathy}/100`, 16, this.scoreColor(empathy), yPos);
        yPos = this.addLabel(popup, `Prioritization: ${prioritization}/100`, 16, this.scoreColor(prioritization), yPos);
        yPos = this.addLabel(popup, `Overall: ${overall}/100`, 20, this.scoreColor(overall), yPos);
        yPos -= 15;

        // ── Team Feedback
        yPos = this.addLabel(popup, '── Team Feedback ──', 18, '#FFFFFF', yPos);
        for (const [, ms] of s.memberStats) {
            const feedback = getMemberFeedback(ms);
            const nameColor = ms.burnedOut ? '#E74C3C' : ms.disengaged ? '#F39C12' : '#2ECC71';
            yPos = this.addLabel(popup, `${ms.name}: ${feedback}`, 14, nameColor, yPos);
        }
        yPos -= 15;

        // ── Play Again hint
        this.addLabel(popup, 'Tap to close', 14, '#888888', yPos);

        // Close on tap
        overlay.on(Node.EventType.TOUCH_END, () => {
            tween(popup).to(0.2, { scale: new Vec3(0, 0, 1) }).call(() => {
                overlay.removeFromParent();
                overlay.destroy();
            }).start();
        });

        this.popupNode = overlay;
    }

    private addLabel(parent: Node, text: string, fontSize: number, color: string, yPos: number): number {
        const node = new Node();
        parent.addChild(node);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = new Color(color);
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        const transform = node.getComponent(UITransform)!;
        transform.width = 440;
        node.setPosition(0, yPos, 0);
        return yPos - fontSize - 10;
    }

    private scoreColor(score: number): string {
        if (score >= 70) return '#2ECC71';
        if (score >= 40) return '#F39C12';
        return '#E74C3C';
    }

    // ── Scoring ────────────────────────────────────

    private getDelegationScore(): number {
        const counts = [...this.stats.memberStats.values()].map(m => m.tasksAssigned);
        if (counts.length === 0) return 0;
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        if (avg === 0) return 0;
        const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
        return Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 15)));
    }

    private getEmpathyScore(): number {
        let score = 50;
        score += this.stats.oneOnOnes * 15;
        score -= this.stats.burnouts * 20;
        score -= this.stats.disengagements * 15;
        score -= this.stats.weaknessMatches * 3;
        score += this.stats.strengthMatches * 2;
        return Math.max(0, Math.min(100, score));
    }

    private getPrioritizationScore(): number {
        let score = 50;
        score += this.stats.delegateUps * 10;
        const total = this.stats.totalTasksAssigned + this.stats.totalTasksSkipped;
        if (total > 0) score += Math.round((this.stats.totalTasksAssigned / total) * 30);
        score += this.stats.wavesCompleted * 3;
        score -= this.stats.totalTasksSkipped;
        return Math.max(0, Math.min(100, score));
    }

    private onNewGame(): void {
        this.stats = this.freshStats();
        if (this.popupNode) {
            this.popupNode.removeFromParent();
            this.popupNode.destroy();
            this.popupNode = null;
        }
    }
}
