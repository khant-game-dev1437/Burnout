import { _decorator, Component, Enum, Label } from 'cc';
const { ccclass, property } = _decorator;

export enum SkillType {
    Technical,
    Creative,
    Communication,
    Design,
}

export enum Mood {
    Happy,
    Neutral,
    Sad,
    Angry,
}

// ── Tuning Constants ───────────────────────────────

const BASE_ENERGY_COST = 15;
const BASE_QUALITY = 50;
const BASE_MORALE_COST = 5;

const STRENGTH_QUALITY_BONUS = 30;
const STRENGTH_ENERGY_MULT = 0.7;
const STRENGTH_MORALE_BOOST = -25;

const WEAKNESS_QUALITY_PENALTY = 20;
const WEAKNESS_ENERGY_MULT = 1.5;
const WEAKNESS_MORALE_COST = 15;

const SAD_ENERGY_MULT = 1.3;
const SAD_MORALE_EXTRA = 5;

const OVERLOAD_THRESHOLD = 3;
const OVERLOAD_ENERGY_MULT = 1.5;
const OVERLOAD_MORALE_EXTRA = 10;

const LOW_ENERGY_THRESHOLD = 30;
const SLOW_RECOVERY_ENERGY_MULT = 1.3;

const BURNOUT_QUALITY_MULT = 0.3;
const DISENGAGE_QUALITY_MULT = 0.5;

const RECOVERY_ENERGY = 20;
const SLOW_RECOVERY_ENERGY = 10;
const SLOW_RECOVERY_THRESHOLD = 40;
const BURNOUT_RECOVERY_THRESHOLD = 30;
const BURNOUT_RECOVERY_ENERGY = 5;

const IDLE_MORALE_PENALTY = 10;
const DAYS_BEFORE_DISENGAGE = 2;
const MORALE_RECOVERY_CAP = 50;
const MORALE_RECOVERY_RATE = 5;

const ONE_ON_ONE_BOOST = 25;
const DISENGAGE_RECOVERY_THRESHOLD = 30;

const MORALE_HAPPY = 70;
const MORALE_NEUTRAL = 40;

const INITIAL_MORALE = 70;

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
    let result = pickRandom(DIALOGUES[key]).replace(/{name}/g, name);
    for (const k in extra) {
        result = result.replace(`{${k}}`, String(extra[k]));
    }
    return result;
}

const MEMBER_COLORS = ['#3498DB', '#E67E22', '#2ECC71', '#9B59B6'];
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
    slowRecovery: boolean = false;

    // UI binding — assign in prefab inspector
    @property({ type: Label })
    lblStrengthWeakness: Label = null!;

    // Runtime state
    private _memberDisplayName: string = '';
    color: string = '#FFFFFF';
    mood: Mood = Mood.Neutral;
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
        this.updateMood();
    }

    public get displayName(): string {
        return this._memberDisplayName;
    }

    public canWork(): boolean {
        return !this.burnedOut && !this.disengaged && this.energy > 0;
    }

    /** Update mood based on current morale */
    private updateMood(): void {
        if (this.burnedOut || this.disengaged) {
            this.mood = Mood.Angry;
        } else if (this.morale >= MORALE_HAPPY) {
            this.mood = Mood.Happy;
        } else if (this.morale >= MORALE_NEUTRAL) {
            this.mood = Mood.Neutral;
        } else {
            this.mood = Mood.Sad;
        }
    }

    public assignTask(taskSkill: SkillType, taskDifficulty: number): { quality: number; message: string } {
        this.assignedTaskCount++;

        let energyCost = 15 + taskDifficulty * 10;   // diff1=25, diff2=35, diff3=45
        let moraleCost = BASE_MORALE_COST;
        let quality = BASE_QUALITY;
        let message = '';

        if (taskSkill === this.strength) {
            quality += STRENGTH_QUALITY_BONUS;
            energyCost *= STRENGTH_ENERGY_MULT;
            moraleCost = -(15 + taskDifficulty * 5);   // diff1=+20, diff2=+25, diff3=+30
            message = dialog('strengthMatch', this._memberDisplayName);
        } else if (taskSkill === this.weakness) {
            quality -= WEAKNESS_QUALITY_PENALTY;
            energyCost *= WEAKNESS_ENERGY_MULT;
            moraleCost = WEAKNESS_MORALE_COST + (taskDifficulty * 3);  // harder mismatch = slightly worse
            message = dialog('weaknessMatch', this._memberDisplayName);
        } else {
            message = dialog('neutralMatch', this._memberDisplayName);
        }

        if (this.mood === Mood.Sad) {
            energyCost *= SAD_ENERGY_MULT;
            moraleCost += SAD_MORALE_EXTRA;
        }

        if (this.slowRecovery && this.energy < LOW_ENERGY_THRESHOLD) {
            energyCost *= SLOW_RECOVERY_ENERGY_MULT;
        }

        if (this.assignedTaskCount > OVERLOAD_THRESHOLD) {
            energyCost *= OVERLOAD_ENERGY_MULT;
            moraleCost += OVERLOAD_MORALE_EXTRA;
            message = dialog('overloaded', this._memberDisplayName);
        }

        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy - energyCost));
        this.morale = Math.max(0, Math.min(this.maxMorale, this.morale - moraleCost));

        if (this.energy <= 0) {
            this.burnedOut = true;
            quality = Math.floor(quality * BURNOUT_QUALITY_MULT);
            message = dialog('burnedOut', this._memberDisplayName);
        }

        if (this.morale <= 0) {
            this.disengaged = true;
            quality = Math.floor(quality * DISENGAGE_QUALITY_MULT);
            message = dialog('disengaged', this._memberDisplayName);
        }

        this.updateMood();
        return { quality: Math.max(0, Math.min(100, quality)), message };
    }

    public endDay(): string[] {
        const messages: string[] = [];

        if (this.assignedTaskCount === 0) {
            this.daysIgnored++;
            messages.push(dialog('idle', this._memberDisplayName));
            this.morale = Math.max(0, this.morale - IDLE_MORALE_PENALTY);

            if (this.daysIgnored >= DAYS_BEFORE_DISENGAGE) {
                this.disengaged = true;
                messages.push(dialog('idleIgnored', this._memberDisplayName, { days: this.daysIgnored }));
            }
        } else {
            this.daysIgnored = 0;
        }

        // Energy recovers in real-time during waves (see GameManager.drainEagerMembers)
        // Burnout recovery check
        if (this.burnedOut && this.energy >= BURNOUT_RECOVERY_THRESHOLD) {
            this.burnedOut = false;
            messages.push(dialog('recovered', this._memberDisplayName));
        }

        this.assignedTaskCount = 0;
        this.updateMood();
        return messages;
    }

    public oneOnOne(): string {
        this.morale = Math.min(this.maxMorale, this.morale + ONE_ON_ONE_BOOST);
        this.updateMood();
        if (this.disengaged && this.morale > DISENGAGE_RECOVERY_THRESHOLD) {
            this.disengaged = false;
            this.updateMood();
            return dialog('oneOnOneRecovery', this._memberDisplayName);
        }
        return dialog('oneOnOneNormal', this._memberDisplayName);
    }

    /** Drain morale over time (called each frame during wave timer). Returns true if member became disengaged. */
    public drainMorale(amount: number): boolean {
        if (this.burnedOut || this.disengaged) return false;
        this.morale = Math.max(0, this.morale - amount);
        this.updateMood();
        if (this.morale <= 0) {
            this.disengaged = true;
            this.updateMood();
            return true;
        }
        return false;
    }

    /** Recover energy over time when not working */
    public recoverEnergy(amount: number): void {
        if (this.burnedOut || this.disengaged) return;
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    public resetForNewGame(): void {
        this._memberDisplayName = this.memberName;
        this.energy = this.maxEnergy;
        this.morale = INITIAL_MORALE;
        this.burnedOut = false;
        this.disengaged = false;
        this.assignedTaskCount = 0;
        this.totalTasksCompleted = 0;
        this.daysIgnored = 0;
        this.updateMood();
    }
}
