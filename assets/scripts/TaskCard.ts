import { _decorator, Component, Label, Sprite, Color, Node, Vec3, UITransform, EventTouch, find, tween } from 'cc';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('TaskCard')
export class TaskCard extends Component {

    @property({ type: Label })
    lblTitle: Label = null!;

    @property({ type: Label })
    lblSkill: Label = null!;

    @property({ type: Label })
    lblPriority: Label = null!;

    @property({ type: Label })
    lblAssigned: Label = null!;

    @property({ type: Sprite })
    background: Sprite = null!;


    private _originalColor: Color = new Color();
    private _originalParent: Node = null!;
    private _originalIndex: number = 0;
    private _originalWorldPos: Vec3 = new Vec3();
    private _assigned: boolean = false;
    private _dragging: boolean = false;

    // Long-press state
    private _pressing: boolean = false;
    private _pressTimer: number = 0;
    private _pressStartPos: Vec3 = new Vec3();
    private static readonly LONG_PRESS_TIME = 0.25;   // seconds to hold before drag
    private static readonly MOVE_THRESHOLD = 10;       // px — cancel if finger moves too much

    // Callback — TaskSpawner sets this. Returns true if assigned.
    public onDropped: ((cardNode: Node, worldPos: Vec3) => boolean) | null = null;

    start(): void {
        if (this.background) {
            this._originalColor = this.background.color.clone();
        }
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchHoldMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchHoldEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchHoldEnd, this);
    }

    update(dt: number): void {
        if (!this._pressing || this._dragging) return;

        this._pressTimer += dt;
        if (this._pressTimer >= TaskCard.LONG_PRESS_TIME) {
            this._pressing = false;
            this.startDrag();
        }
    }

    public get originalColor(): Color {
        return this._originalColor;
    }

    // ── Long Press Detection ────────────────────────

    private onTouchStart(event: EventTouch): void {
        if (this._assigned || this._dragging) return;
        this._pressing = true;
        this._pressTimer = 0;
        const loc = event.getUILocation();
        this._pressStartPos.set(loc.x, loc.y, 0);
    }

    private onTouchHoldMove(event: EventTouch): void {
        if (!this._pressing || this._dragging) return;
        // Cancel long-press if finger moved too far (allow scroll)
        const loc = event.getUILocation();
        const dx = loc.x - this._pressStartPos.x;
        const dy = loc.y - this._pressStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > TaskCard.MOVE_THRESHOLD) {
            this._pressing = false;
        }
    }

    private onTouchHoldEnd(event: EventTouch): void {
        this._pressing = false;
    }

    // ── Drag & Drop ─────────────────────────────────

    private startDrag(): void {
        if (this._assigned) return;
        this._dragging = true;
        if (AudioManager.instance) AudioManager.instance.playClick();

        // Save original state
        this._originalParent = this.node.parent!;
        this._originalIndex = this.node.getSiblingIndex();
        this._originalWorldPos = this.node.worldPosition.clone();

        // Move to Canvas so it's free from Layout
        const canvas = find('Canvas');
        if (canvas) {
            const worldPos = this.node.worldPosition.clone();
            canvas.addChild(this.node);
            this.node.worldPosition = worldPos;
        }

        this.node.setScale(new Vec3(1, 1, 1));

        // Listen on canvas for move/end
        const canvas2 = find('Canvas');
        if (canvas2) {
            canvas2.on(Node.EventType.TOUCH_MOVE, this.onMove, this);
            canvas2.on(Node.EventType.TOUCH_END, this.onEnd, this);
            canvas2.on(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
        }
    }

    private onMove(event: EventTouch): void {
        if (!this._dragging) return;

        const canvas = find('Canvas');
        if (!canvas) return;

        const uiTransform = canvas.getComponent(UITransform);
        if (uiTransform) {
            const localPos = uiTransform.convertToNodeSpaceAR(
                new Vec3(event.getUILocation().x, event.getUILocation().y, 0)
            );
            this.node.setPosition(localPos);
        }
    }

    private onEnd(event: EventTouch): void {
        if (!this._dragging) return;
        this._dragging = false;

        // Remove canvas listeners
        const canvas = find('Canvas');
        if (canvas) {
            canvas.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
            canvas.off(Node.EventType.TOUCH_END, this.onEnd, this);
            canvas.off(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
        }

        // Check drop
        let success = false;
        if (this.onDropped) {
            const worldPos = this.node.worldPosition.clone();
            success = this.onDropped(this.node, worldPos);
        }

        if (success) {
            if (AudioManager.instance) AudioManager.instance.playClick();
            // Card will be destroyed by markAssigned — hide immediately so it's not visible on Canvas
            this.node.active = false;
            return;
        }

        // Not assigned — snap back to original parent
        this.node.setScale(new Vec3(1, 1, 1));
        if (this._originalParent) {
            this._originalParent.insertChild(this.node, this._originalIndex);
        }
        if (this.background) {
            this.background.color = this._originalColor.clone();
        }
    }

    // ── Setters ─────────────────────────────────────

    public setTitle(text: string, color?: string): void {
        if (this.lblTitle) {
            this.lblTitle.string = text;
            if (color) this.lblTitle.color = new Color(color);
        }
    }

    public setSkill(text: string, color: string): void {
        if (this.lblSkill) {
            this.lblSkill.string = text;
            this.lblSkill.color = new Color(color);
        }
    }

    public setPriority(text: string, color: string): void {
        if (this.lblPriority) {
            this.lblPriority.string = text;
            this.lblPriority.color = new Color(color);
        }
    }

    public setAssigned(memberName: string): void {
        this._assigned = true;
        if (this.lblAssigned) {
            this.lblAssigned.string = memberName ? `→ ${memberName}` : '';
        }
    }

    public select(): void {
        if (this.background) this.background.color = new Color('#D4E6F1');
    }

    public deselect(): void {
        if (this.background) this.background.color = this._originalColor.clone();
    }

    public dim(): void {
        if (this.background) this.background.color = new Color('#333333');
    }
}
