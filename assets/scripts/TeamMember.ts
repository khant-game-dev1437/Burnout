import { _decorator, Component, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum SkillType {
    Technical,
    Creative,
    Communication,
    Design,
}

// ── Dialogues ───────────────────────────────────────

const DIALOGUES = {
    strengthMatch: [
        '{name} nailed it — right in their wheelhouse!',
        '{name} crushed it. Perfect fit.',
        '{name}: "This is what I do best."',
    ],
    weaknessMatch: [
        '{name} struggled hard with this one...',
        '{name}: "This really isn\'t my area..."',
        '{name} barely got through it.',
    ],
    neutralMatch: [
        '{name} got it done.',
        '{name}: "Done. Next?"',
        '{name} handled it fine.',
    ],
    overloaded: [
        '{name} is overwhelmed — too many tasks!',
        '{name}: "I literally cannot keep up."',
        '{name}: "Another one?! I\'m drowning here."',
    ],
    burnedOut: [
        '{name} has BURNED OUT!',
        '{name}: "I can\'t do this anymore."',
        '{name}: "...I\'m done."',
    ],
    disengaged: [
        '{name} has checked out mentally...',
        '{name}: "Whatever. I\'ll be at my desk."',
        '{name}: "Does it even matter what I think?"',
    ],
    idle: [
        '{name} had nothing to do today and feels sidelined.',
        '{name}: "Guess I\'m not needed."',
        '{name}: "Nothing for me today? Okay..."',
    ],
    idleIgnored: [
        '{name} has disengaged — ignored for {days} days straight.',
    ],
    recovered: [
        '{name} is back — but still fragile.',
        '{name}: "I\'m okay... I think."',
    ],
    oneOnOneRecovery: [
        '{name}: "Thanks for checking in... I needed that."',
        '{name}: "Good talk. I feel better."',
    ],
    oneOnOneNormal: [
        '{name}: "I appreciate you making time for me."',
        '{name}: "Thanks, boss. Means a lot."',
    ],
};

function pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

function dialog(key: keyof typeof DIALOGUES, name: string, extra: Record<string, string | number> = {}): string {
    let result = pickRandom(DIALOGUES[key]).replace(/{name}/g, name); // replace name place holder with actual member name
    for (const k in extra) {
        result = result.replace(`{${k}}`, String(extra[k]));
    }
    return result;
}

const MEMBER_COLORS = ['#4A90D9', '#E6A23C', '#67C23A', '#909399'];
let colorIndex = 0;

// ── Component ───────────────────────────────────────

@ccclass('TeamMember')
export class TeamMember extends Component {

    // Inspector fields
    @property
    memberName: string = '';

    @property({ type: Enum(SkillType) })
    strength: SkillType = SkillType.Technical;

    @property({ type: Enum(SkillType) })
    weakness: SkillType = SkillType.Communication;

    @property
    energy: number = 100;

    @property
    morale: number = 70;

    @property
    hatesBeingIgnored: boolean = false;

    @property
    needsVariety: boolean = false;

    @property
    introvert: boolean = false;

    @property
    slowRecovery: boolean = false;

    // Runtime state (not in inspector)
    private _memberDisplayName: string = '';
    color: string = '#FFFFFF';
    maxEnergy: number = 100;
    maxMorale: number = 100;
    burnedOut: boolean = false;
    disengaged: boolean = false;
    assignedTaskCount: number = 0;
    totalTasksCompleted: number = 0;
    daysIgnored: number = 0;

    start(): void {
        this._memberDisplayName = this.memberName;
        this.color = MEMBER_COLORS[colorIndex % MEMBER_COLORS.length];
        colorIndex++;
        this.maxEnergy = this.energy;
        this.maxMorale = 100;
    }

    public get displayName(): string {
        return this._memberDisplayName;
    }

    public canWork(): boolean {
        return !this.burnedOut && this.energy > 0;
    }

    public assignTask(taskSkill: SkillType, taskDifficulty: number): { quality: number; message: string } {
        this.assignedTaskCount++;

        let energyCost = taskDifficulty * 15;
        let moraleCost = 5;
        let quality = 50;
        let message = '';

        if (taskSkill === this.strength) {
            quality += 30;
            energyCost *= 0.7;
            moraleCost = -5;
            message = dialog('strengthMatch', this._memberDisplayName);
        } else if (taskSkill === this.weakness) {
            quality -= 20;
            energyCost *= 1.5;
            moraleCost = 15;
            message = dialog('weaknessMatch', this._memberDisplayName);
        } else {
            message = dialog('neutralMatch', this._memberDisplayName);
        }

        // Trait modifiers
        if (this.introvert && taskSkill === SkillType.Communication) {
            energyCost *= 1.4;
            moraleCost += 10;
        }
        if (this.needsVariety && this.assignedTaskCount > 2) {
            moraleCost += 10;
        }
        if (this.hatesBeingIgnored && taskSkill === SkillType.Communication) {
            moraleCost = -10;
        }
        if (this.slowRecovery && this.energy < 30) {
            energyCost *= 1.3;
        }

        // Overload
        if (this.assignedTaskCount > 3) {
            energyCost *= 1.5;
            moraleCost += 10;
            message = dialog('overloaded', this._memberDisplayName);
        }

        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy - energyCost));
        this.morale = Math.max(0, Math.min(this.maxMorale, this.morale - moraleCost));

        if (this.energy <= 0) {
            this.burnedOut = true;
            quality = Math.floor(quality * 0.3);
            message = dialog('burnedOut', this._memberDisplayName);
        }

        if (this.morale <= 10) {
            this.disengaged = true;
            quality = Math.floor(quality * 0.5);
            message = dialog('disengaged', this._memberDisplayName);
        }

        return { quality: Math.max(0, Math.min(100, quality)), message };
    }

    public endDay(): string[] {
        const messages: string[] = [];

        if (this.assignedTaskCount === 0) {
            this.daysIgnored++;
            let idleLoss = 10;
            if (this.hatesBeingIgnored) idleLoss = 25;
            messages.push(dialog('idle', this._memberDisplayName));
            this.morale = Math.max(0, this.morale - idleLoss);

            if (this.daysIgnored >= 2) {
                this.disengaged = true;
                messages.push(dialog('idleIgnored', this._memberDisplayName, { days: this.daysIgnored }));
            }
        } else {
            this.daysIgnored = 0;
        }

        if (!this.burnedOut) {
            let recovery = 20;
            if (this.slowRecovery && this.energy < 40) recovery = 10;
            this.energy = Math.min(this.maxEnergy, this.energy + recovery);
        } else {
            this.energy = Math.min(this.maxEnergy, this.energy + 5);
            if (this.energy >= 30) {
                this.burnedOut = false;
                messages.push(dialog('recovered', this._memberDisplayName));
            }
        }

        if (!this.disengaged && this.morale < 50) {
            this.morale = Math.min(50, this.morale + 5);
        }

        this.assignedTaskCount = 0;
        return messages;
    }

    public oneOnOne(): string {
        this.morale = Math.min(this.maxMorale, this.morale + 25);
        if (this.disengaged && this.morale > 30) {
            this.disengaged = false;
            return dialog('oneOnOneRecovery', this._memberDisplayName);
        }
        return dialog('oneOnOneNormal', this._memberDisplayName);
    }

    public resetForNewGame(): void {
        this._memberDisplayName = this.memberName;
        this.energy = this.maxEnergy;
        this.morale = 70;
        this.burnedOut = false;
        this.disengaged = false;
        this.assignedTaskCount = 0;
        this.totalTasksCompleted = 0;
        this.daysIgnored = 0;
    }
}
