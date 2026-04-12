import { _decorator, Component, Label, Node, Button, BlockInputEvents } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';

const { ccclass, property } = _decorator;

const STORY_LINES = [
    'You just got promoted to Department Head. Congratulations... kind of.',
    '',
    'Your team has 4 members, each with unique strength. You can\'t do tasks yourself — you must delegate.',
    '',
    '',
    'Match tasks to strengths → morale goes up.',
    '',
    'Give wrong tasks → morale drops.',
    '',
    'Ignore someone → they disengage.',
    '',
    'Overwork someone → they burn out.',
    '',
    '',
    'Survive 10 waves. Good luck, boss.',
];

const TYPE_SPEED = 0.03;          // seconds per character
const LINE_PAUSE = 0.2;           // pause between lines

@ccclass('StoryManager')
export class StoryManager extends Component {

    @property({ type: Label })
    lblStory: Label = null!;

    @property({ type: Node })
    storyPanel: Node = null!;

    @property({ type: Button })
    btnStart: Button = null!;

    @property({ type: Node })
    gameUI: Node = null!;

    private currentLine: number = 0;
    private currentChar: number = 0;
    private displayText: string = '';
    private isTyping: boolean = false;
    private typeTimer: number = 0;
    private pauseTimer: number = 0;
    private isPaused: boolean = false;
    private skipRequested: boolean = false;

    start(): void {
        // Hide game UI, show story
        if (this.gameUI) this.gameUI.active = false;
        if (this.btnStart) {
            this.btnStart.node.active = false;
            this.btnStart.node.on('click', this.onStartClicked, this);
        }

        if (this.lblStory) this.lblStory.string = '';

        // Ensure panel is touchable and listen for tap to skip
        if (this.storyPanel) {
            if (!this.storyPanel.getComponent(BlockInputEvents)) {
                this.storyPanel.addComponent(BlockInputEvents);
            }
            this.storyPanel.on(Node.EventType.TOUCH_END, this.onTap, this);
        }

        this.isTyping = true;
    }

    update(dt: number): void {
        if (!this.isTyping) return;

        // Pause between lines
        if (this.isPaused) {
            this.pauseTimer -= dt;
            if (this.pauseTimer <= 0) {
                this.isPaused = false;
            }
            return;
        }

        if (this.currentLine >= STORY_LINES.length) {
            this.finishTyping();
            return;
        }

        const line = STORY_LINES[this.currentLine];

        // Empty line = just add newline and pause
        if (line === '') {
            this.displayText += '\n';
            if (this.lblStory) this.lblStory.string = this.displayText;
            this.currentLine++;
            this.isPaused = true;
            this.pauseTimer = LINE_PAUSE;
            return;
        }

        // Type characters
        if (this.skipRequested) {
            // Show rest of current line instantly
            this.displayText += line.substring(this.currentChar) + '\n';
            if (this.lblStory) this.lblStory.string = this.displayText;
            this.currentLine++;
            this.currentChar = 0;
            this.skipRequested = false;
            this.isPaused = true;
            this.pauseTimer = LINE_PAUSE * 0.5;
            return;
        }

        this.typeTimer += dt;
        if (this.typeTimer >= TYPE_SPEED) {
            this.typeTimer = 0;
            this.displayText += line[this.currentChar];
            this.currentChar++;
            if (this.lblStory) this.lblStory.string = this.displayText;

            if (this.currentChar >= line.length) {
                this.displayText += '\n';
                if (this.lblStory) this.lblStory.string = this.displayText;
                this.currentLine++;
                this.currentChar = 0;
                this.isPaused = true;
                this.pauseTimer = LINE_PAUSE;
            }
        }
    }

    private onTap(): void {
        if (!this.isTyping) return;

        if (this.skipRequested) {
            // Second tap — show all remaining text instantly
            this.displayText = STORY_LINES.join('\n');
            if (this.lblStory) this.lblStory.string = this.displayText;
            this.finishTyping();
        } else {
            // First tap — skip current line
            this.skipRequested = true;
        }
    }

    private finishTyping(): void {
        this.isTyping = false;
        if (this.btnStart) this.btnStart.node.active = true;
    }

    private onStartClicked(): void {
        if (this.storyPanel) this.storyPanel.active = false;
        if (this.gameUI) this.gameUI.active = true;
        gameEvents.emit(GameEvent.GAME_START);
    }
}
