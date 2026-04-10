import { Node, tween, Vec3, Color, Sprite, Label, UIOpacity, UITransform } from 'cc';
import { gameEvents, GameEvent } from './GameEvents';
import { Mood } from './TeamMember';

// ── Tween Helpers ───────────────────────────────────

/** Bounce a node in — scale from 0 to 1 with overshoot */
export function bounceIn(node: Node, delay: number = 0): void {
    node.setScale(new Vec3(0, 0, 1));
    tween(node)
        .delay(delay)
        .to(0.3, { scale: new Vec3(1.15, 1.15, 1) })
        .to(0.15, { scale: new Vec3(1, 1, 1) })
        .start();
}

/** Shake a node — for errors, burnout, overload */
export function shake(node: Node, intensity: number = 10): void {
    const originalPos = node.position.clone();
    tween(node)
        .to(0.05, { position: new Vec3(originalPos.x + intensity, originalPos.y, 0) })
        .to(0.05, { position: new Vec3(originalPos.x - intensity, originalPos.y, 0) })
        .to(0.05, { position: new Vec3(originalPos.x + intensity * 0.5, originalPos.y, 0) })
        .to(0.05, { position: new Vec3(originalPos.x - intensity * 0.5, originalPos.y, 0) })
        .to(0.05, { position: originalPos })
        .start();
}

/** Pulse scale — draws attention */
export function pulse(node: Node): void {
    tween(node)
        .to(0.15, { scale: new Vec3(1.1, 1.1, 1) })
        .to(0.15, { scale: new Vec3(1, 1, 1) })
        .start();
}

/** Shrink slightly — member is sad or disengaged */
export function shrink(node: Node): void {
    tween(node)
        .to(0.3, { scale: new Vec3(0.9, 0.9, 1) })
        .start();
}

/** Restore scale to normal */
export function restoreScale(node: Node): void {
    tween(node)
        .to(0.3, { scale: new Vec3(1, 1, 1) })
        .start();
}

/** Grey out a node — member burned out */
export function greyOut(node: Node): void {
    const sprite = node.getComponent(Sprite);
    if (sprite) {
        tween(sprite)
            .to(0.5, { color: new Color(80, 80, 80, 255) })
            .start();
    }
}

/** Restore color */
export function restoreColor(node: Node, color: string): void {
    const sprite = node.getComponent(Sprite);
    if (sprite) {
        tween(sprite)
            .to(0.3, { color: new Color(color) })
            .start();
    }
}

/** Flash a color briefly — green for good, red for bad */
export function flashColor(node: Node, flashHex: string, originalHex: string, duration: number = 0.3): void {
    const sprite = node.getComponent(Sprite);
    if (!sprite) return;
    sprite.color = new Color(flashHex);
    tween(sprite)
        .delay(duration)
        .to(0.3, { color: new Color(originalHex) })
        .start();
}

/** Fade in a node */
export function fadeIn(node: Node, duration: number = 0.5): void {
    let opacity = node.getComponent(UIOpacity);
    if (!opacity) opacity = node.addComponent(UIOpacity);
    opacity.opacity = 0;
    tween(opacity)
        .to(duration, { opacity: 255 })
        .start();
}

/** Fade out a node */
export function fadeOut(node: Node, duration: number = 0.5): void {
    let opacity = node.getComponent(UIOpacity);
    if (!opacity) opacity = node.addComponent(UIOpacity);
    tween(opacity)
        .to(duration, { opacity: 0 })
        .start();
}

/** Slide in from a direction */
export function slideIn(node: Node, fromX: number, fromY: number, duration: number = 0.4, delay: number = 0): void {
    const targetPos = node.position.clone();
    node.setPosition(fromX, fromY, 0);
    tween(node)
        .delay(delay)
        .to(duration, { position: targetPos }, { easing: 'backOut' })
        .start();
}

/** Animate bar fill smoothly */
export function animateBar(barFill: Node, targetWidth: number, duration: number = 0.4): void {
    const transform = barFill.getComponent(UITransform);
    if (!transform) return;
    tween(transform)
        .to(duration, { width: targetWidth })
        .start();
}

/** Day transition — big text fades in and out */
export function dayTransition(node: Node, day: number, callback: () => void): void {
    const label = node.getComponent(Label);
    if (label) label.string = `Day ${day}`;

    let opacity = node.getComponent(UIOpacity);
    if (!opacity) opacity = node.addComponent(UIOpacity);

    node.active = true;
    node.setScale(new Vec3(0.5, 0.5, 1));
    opacity.opacity = 0;

    tween(opacity)
        .to(0.5, { opacity: 255 })
        .delay(1)
        .to(0.5, { opacity: 0 })
        .call(() => {
            node.active = false;
            callback();
        })
        .start();

    tween(node)
        .to(0.5, { scale: new Vec3(1, 1, 1) })
        .start();
}

/** Member mood animation — update visuals based on mood */
export function animateMood(node: Node, mood: Mood): void {
    switch (mood) {
        case Mood.Happy:
            restoreScale(node);
            pulse(node);
            break;
        case Mood.Neutral:
            restoreScale(node);
            break;
        case Mood.Sad:
            shrink(node);
            break;
        case Mood.Angry:
            shake(node, 5);
            greyOut(node);
            break;
    }
}

/** Assign task animation — card flies toward member */
export function animateAssignment(
    cardNode: Node,
    memberNode: Node,
    isGoodMatch: boolean,
    callback: () => void
): void {
    const memberPos = memberNode.worldPosition;
    const cardWorldPos = cardNode.worldPosition;

    // Flash green or red
    const flashColor = isGoodMatch ? '#2ECC71' : '#E74C3C';
    const sprite = cardNode.getComponent(Sprite);
    if (sprite) sprite.color = new Color(flashColor);

    // Shrink and move toward member
    tween(cardNode)
        .to(0.4, {
            scale: new Vec3(0.3, 0.3, 1),
            worldPosition: new Vec3(memberPos.x, memberPos.y, 0),
        }, { easing: 'cubicIn' })
        .call(() => {
            // Pulse the member
            pulse(memberNode);
            callback();
        })
        .start();
}
