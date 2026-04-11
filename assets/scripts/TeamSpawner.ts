import { _decorator, Component, Prefab, instantiate, Node, Label, Sprite, Color, UITransform } from 'cc';
import { TeamMember, SkillType, Mood } from './TeamMember';
import { gameEvents, GameEvent } from './GameEvents';
import { bounceIn, animateMood, animateBar } from './GameAnimations';
import { SKILL_NAMES, COLOR_GREEN, COLOR_YELLOW, COLOR_RED, COLOR_BLUE } from './GameConstants';

const { ccclass, property } = _decorator;

// ── Member Config ───────────────────────────────────

interface MemberConfig {
    name: string;
    strength: SkillType;
    weakness: SkillType;
    energy: number;
    morale: number;
    slowRecovery: boolean;
    color: string;
}

const TEAM_DATA: MemberConfig[] = [
    {
        name: 'Min Khant',
        strength: SkillType.Technical,
        weakness: SkillType.Communication,
        energy: 100, morale: 70,
        slowRecovery: false,
        color: '#3498DB',
    },
    {
        name: 'Leo',
        strength: SkillType.Creative,
        weakness: SkillType.Design,
        energy: 100, morale: 85,
        slowRecovery: false,
        color: '#E67E22',
    },
    {
        name: 'Timber Saw',
        strength: SkillType.Communication,
        weakness: SkillType.Creative,
        energy: 100, morale: 80,
        slowRecovery: false,
        color: '#2ECC71',
    },
    {
        name: 'Chris',
        strength: SkillType.Design,
        weakness: SkillType.Technical,
        energy: 100, morale: 65,
        slowRecovery: true,
        color: '#9B59B6',
    },
];

// ── Spawner Component ───────────────────────────────

@ccclass('TeamSpawner')
export class TeamSpawner extends Component {

    @property({ type: Prefab })
    memberPrefab: Prefab = null!;

    private members: TeamMember[] = [];

    start(): void {
        this.spawnTeam();
    }

    private spawnTeam(): void {
        for (let i = 0; i < TEAM_DATA.length; i++) {
            const config = TEAM_DATA[i];
            const node = instantiate(this.memberPrefab);
            this.node.addChild(node);

            // Set up TeamMember component
            const member = node.getComponent(TeamMember) || node.addComponent(TeamMember);
            member.memberName = config.name;
            member.strength = config.strength;
            member.weakness = config.weakness;
            member.energy = config.energy;
            member.morale = config.morale;
            member.slowRecovery = config.slowRecovery;

            // Set card background color
            const bg = node.getComponent(Sprite);
            if (bg) {
                bg.color = new Color(config.color);
            }

            // Click handler — emit event for GameManager
            node.on(Node.EventType.TOUCH_END, () => {
                gameEvents.emit(GameEvent.MEMBER_CLICKED, member);
            });

            // Set name label
            const lblName = node.getChildByName('lbl_name');
            if (lblName) {
                const label = lblName.getComponent(Label);
                if (label) label.string = config.name;
            }

            // Set strength/weakness via bound property
            if (member.lblStrengthWeakness) {
                const str = SKILL_NAMES[config.strength];
                const wk = SKILL_NAMES[config.weakness];
                member.lblStrengthWeakness.string = `\u2713${str}  \u2717${wk}`;
            }

            // Update bars and mood
            this.updateMemberUI(node, config);

            this.members.push(member);

            // Bounce in with stagger
            bounceIn(node, i * 0.15);
        }
    }

    /** Update a member's UI elements */
    public updateMemberUI(node: Node, config?: MemberConfig): void {
        const member = node.getComponent(TeamMember);
        if (!member) return;

        // Energy bar fill
        const energyBar = node.getChildByName('EnergyBar');
        if (energyBar) {
            const fill = energyBar.getChildByName('Bar');
            if (fill) {
                const fillTransform = fill.getComponent(UITransform);
                const parentTransform = energyBar.getComponent(UITransform);
                if (fillTransform && parentTransform) {
                    const ratio = member.energy / 100;
                    fillTransform.width = parentTransform.width * ratio;
                }
                const fillSprite = fill.getComponent(Sprite);
                if (fillSprite) {
                    // Green when high, yellow mid, red low
                    if (member.energy > 60) fillSprite.color = new Color(COLOR_GREEN);
                    else if (member.energy > 30) fillSprite.color = new Color(COLOR_YELLOW);
                    else fillSprite.color = new Color(COLOR_RED);
                }
            }
        }

        // Morale bar fill
        const moraleBar = node.getChildByName('MoralBar');
        if (moraleBar) {
            const fill = moraleBar.getChildByName('Bar');
            if (fill) {
                const fillTransform = fill.getComponent(UITransform);
                const parentTransform = moraleBar.getComponent(UITransform);
                if (fillTransform && parentTransform) {
                    const ratio = member.morale / 100;
                    fillTransform.width = parentTransform.width * ratio;
                }
                const fillSprite = fill.getComponent(Sprite);
                if (fillSprite) {
                    if (member.morale > 60) fillSprite.color = new Color(COLOR_BLUE);
                    else if (member.morale > 30) fillSprite.color = new Color(COLOR_YELLOW);
                    else fillSprite.color = new Color(COLOR_RED);
                }
            }
        }

        // Mood emoji
        const lblMood = node.getChildByName('lbl_mood');
        if (lblMood) {
            const label = lblMood.getComponent(Label);
            if (label) {
                switch (member.mood) {
                    case Mood.Happy: label.string = '\uD83D\uDE0A'; break;
                    case Mood.Neutral: label.string = '\uD83D\uDE10'; break;
                    case Mood.Sad: label.string = '\uD83D\uDE1F'; break;
                    case Mood.Angry: label.string = '\uD83D\uDE21'; break;
                }
            }
        }

        // Status label
        const lblStatus = node.getChildByName('lbl_status');
        if (lblStatus) {
            const label = lblStatus.getComponent(Label);
            if (label) {
                if (member.burnedOut) {
                    label.string = 'BURNED OUT';
                    label.color = new Color(COLOR_RED);
                } else if (member.disengaged) {
                    label.string = 'DISENGAGED';
                    label.color = new Color(COLOR_YELLOW);
                } else {
                    label.string = '';
                }
            }
        }
    }

    /** Refresh all member UIs — call this after assignments, end of day, etc */
    public refreshAll(): void {
        const children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            this.updateMemberUI(children[i]);
        }
    }

    /** Get all TeamMember components */
    public getMembers(): TeamMember[] {
        return this.members;
    }
}
