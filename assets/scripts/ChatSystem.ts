import { _decorator, Component, Prefab, instantiate, Node, ScrollView } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { ChatBubble } from './ChatBubble';
import { TeamMember } from './TeamMember';
import { TaskInfo } from './TaskData';
import { bounceIn } from './GameAnimations';

const { ccclass, property } = _decorator;

const SYSTEM_COLOR = '#888888';
const MAX_MESSAGES = 20;

// Member colors — matched to TeamSpawner
const MEMBER_COLORS: Record<string, string> = {
    'Min Khant': '#3498DB',
    'Leo': '#E67E22',
    'Timber Saw': '#2ECC71',
    'Chris': '#9B59B6',
};

// ── Chat Reaction Templates ─────────────────────────

const REACTIONS = {
    taskAssignedGood: [
        'Nice, I got this!',
        'Perfect task for me.',
        'On it, boss!',
    ],
    taskAssignedBad: [
        'Ugh... really?',
        'This is not my thing...',
        'I\'ll try, but no promises.',
    ],
    taskAssignedNeutral: [
        'Okay, adding to my list.',
        'Sure thing.',
        'Working on it.',
    ],
    burnout: [
        'I... can\'t anymore.',
        'I need to stop.',
        'Everything hurts.',
    ],
    disengaged: [
        'Whatever.',
        'Why bother.',
        'I\'m done caring.',
    ],
    oneOnOne: [
        'Thanks for the chat.',
        'I feel heard. Appreciate it.',
        'Good talk, boss.',
    ],
    bossInterrupt: [
        'Oh no, not again...',
        'Here we go...',
        'Brace yourselves.',
    ],
    waveStart: [
        'Here we go again!',
        'New wave, let\'s go.',
        'More tasks incoming...',
        'What\'s on the plate now?',
    ],
    delegateUp: [
        'Smart move, boss.',
        'Good call pushing that back.',
        'Less is more sometimes.',
    ],
};

function pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── ChatSystem Component ────────────────────────────

@ccclass('ChatSystem')
export class ChatSystem extends Component {

    @property({ type: Prefab })
    chatBubblePrefab: Prefab = null!;

    @property({ type: ScrollView })
    scrollView: ScrollView = null!;

    private bubbles: Node[] = [];

    start(): void {
        this.registerEvents();
    }
    
    private registerEvents(): void {
        gameEvents.on(GameEvent.CHAT_MESSAGE, this.onChatMessage, this);
        gameEvents.on(GameEvent.TASK_ASSIGNED, this.onTaskAssigned, this);
        gameEvents.on(GameEvent.MEMBER_BURNOUT, this.onBurnout, this);
        gameEvents.on(GameEvent.MEMBER_DISENGAGED, this.onDisengaged, this);
        gameEvents.on(GameEvent.ONE_ON_ONE, this.onOneOnOne, this);
        gameEvents.on(GameEvent.WAVE_STARTED, this.onWaveStarted, this);
        gameEvents.on(GameEvent.DELEGATE_UP, this.onDelegateUp, this);
        gameEvents.on(GameEvent.NEW_GAME, this.onNewGame, this);
    }

    // ── Event Handlers ──────────────────────────────

    private onChatMessage(message: string, sender: string): void {
        const isSystem = sender === 'System';
        const color = isSystem ? SYSTEM_COLOR : (MEMBER_COLORS[sender] || '#FFFFFF');
        this.addBubble(sender, message, color, isSystem);
    }

    private onTaskAssigned(task: TaskInfo, member: TeamMember): void {
        const isGood = task.skill === member.strength;
        const isBad = task.skill === member.weakness;

        let reaction: string;
        if (isGood) {
            reaction = pickRandom(REACTIONS.taskAssignedGood);
        } else if (isBad) {
            reaction = pickRandom(REACTIONS.taskAssignedBad);
        } else {
            reaction = pickRandom(REACTIONS.taskAssignedNeutral);
        }

        const color = MEMBER_COLORS[member.displayName] || '#FFFFFF';
        this.addBubble(member.displayName, reaction, color);
    }

    private onBurnout(member: TeamMember): void {
        const color = MEMBER_COLORS[member.displayName] || '#FFFFFF';
        this.addBubble(member.displayName, pickRandom(REACTIONS.burnout), color);
        this.addBubble('System', `${member.displayName} has burned out!`, SYSTEM_COLOR, true);
    }

    private onDisengaged(member: TeamMember): void {
        const color = MEMBER_COLORS[member.displayName] || '#FFFFFF';
        this.addBubble(member.displayName, pickRandom(REACTIONS.disengaged), color);
    }

    private onOneOnOne(member: TeamMember): void {
        const color = MEMBER_COLORS[member.displayName] || '#FFFFFF';
        this.addBubble(member.displayName, pickRandom(REACTIONS.oneOnOne), color);
    }

    private onWaveStarted(wave: number): void {
        const names = ['Min Khant', 'Leo', 'Timber Saw', 'Chris'];
        const name = pickRandom(names);
        const color = MEMBER_COLORS[name] || '#FFFFFF';
        this.addBubble(name, pickRandom(REACTIONS.waveStart), color);
    }

    private onDelegateUp(): void {
        const names = ['Min Khant', 'Leo', 'Timber Saw', 'Chris'];
        const name = pickRandom(names);
        const color = MEMBER_COLORS[name] || '#FFFFFF';
        this.addBubble(name, pickRandom(REACTIONS.delegateUp), color);
    }

    private onNewGame(): void {
        this.clearAll();
    }

    // ── Bubble Management ───────────────────────────

    private addBubble(sender: string, message: string, senderColor: string, isSystem: boolean = false): void {
        const node = instantiate(this.chatBubblePrefab);
        this.node.addChild(node);

        const bubble = node.getComponent(ChatBubble);
        if (bubble) {
            bubble.setup(sender, message, senderColor, isSystem);
        }

        this.bubbles.push(node);
        bounceIn(node);

        // Remove oldest if too many
        if (this.bubbles.length > MAX_MESSAGES) {
            const oldest = this.bubbles.shift();
            if (oldest) {
                oldest.removeFromParent();
                oldest.destroy();
            }
        }

        // Scroll to bottom next frame (wait for layout to update)
        this.scheduleOnce(() => {
            if (this.scrollView) {
                this.scrollView.scrollToBottom(0.2);
            }
        }, 0);
    }

    private clearAll(): void {
        for (const node of this.bubbles) {
            node.removeFromParent();
            node.destroy();
        }
        this.bubbles = [];
    }
}
