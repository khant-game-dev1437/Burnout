import { _decorator, Component, Label, Sprite, Color } from 'cc';

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

    start(): void {
        if (this.background) {
            this._originalColor = this.background.color.clone();
        }
    }

    public get originalColor(): Color {
        return this._originalColor;
    }

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
