import { _decorator, Component, Label, Sprite, Color } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ChatBubble')
export class ChatBubble extends Component {

    @property({ type: Sprite })
    background: Sprite = null!;

    @property({ type: Label })
    lblSender: Label = null!;

    @property({ type: Label })
    lblMessage: Label = null!;

    public setup(sender: string, message: string, senderColor: string, isSystem: boolean = false): void {
        if (this.lblSender) {
            this.lblSender.string = sender;
            this.lblSender.color = new Color(senderColor);
        }

        if (this.lblMessage) {
            this.lblMessage.string = message;
            this.lblMessage.color = isSystem ? new Color('#999999') : new Color('#FFFFFF');
        }

        if (this.background) {
            this.background.color = isSystem ? new Color('#2C2C2C') : new Color('#1E1E2E');
        }
    }
}
