import { _decorator, Component, Prefab, instantiate, Node, Color, Vec3, Vec2, UITransform } from 'cc';
import { TaskInfo, TaskPriority, generateDailyTasks, generateBossTask, resetTaskIds } from './TaskData';
import { SkillType, TeamMember } from './TeamMember';
import { TaskCard } from './TaskCard';
import { TeamSpawner } from './TeamSpawner';
import { bounceIn } from './GameAnimations';
import { gameEvents, GameEvent } from './GameEvents';

const { ccclass, property } = _decorator;

const PRIORITY_COLORS: Record<number, string> = {
    [TaskPriority.Low]: '#67C23A',
    [TaskPriority.Medium]: '#E6A23C',
    [TaskPriority.High]: '#F56C6C',
    [TaskPriority.Urgent]: '#FF0000',
};

const SKILL_COLORS: Record<number, string> = {
    [SkillType.Technical]: '#409EFF',
    [SkillType.Creative]: '#E6A23C',
    [SkillType.Communication]: '#67C23A',
    [SkillType.Design]: '#B266FF',
};

const PRIORITY_NAMES = ['Low', 'Medium', 'High', 'Urgent'];
const SKILL_NAMES = ['Technical', 'Creative', 'Communication', 'Design'];

@ccclass('TaskSpawner')
export class TaskSpawner extends Component {

    @property({ type: Prefab })
    taskPrefab: Prefab = null!;

    @property({ type: TeamSpawner })
    teamSpawner: TeamSpawner = null!;

    private taskCards: Map<number, TaskCard> = new Map();
    private currentTasks: TaskInfo[] = [];
    private selectedTaskId: number = -1;

    // Callbacks — GameManager sets these
    public onTaskClicked: ((task: TaskInfo) => void) | null = null;
    public onTaskDroppedOnMember: ((task: TaskInfo, member: TeamMember) => void) | null = null;

    /** Spawn new wave tasks — appends to existing (carry-over) */
    public spawnWaveTasks(count: number = 10): TaskInfo[] {
        const newTasks = generateDailyTasks(count);
        this.currentTasks.push(...newTasks);

        for (const task of newTasks) {
            this.spawnCard(task);
        }

        return newTasks;
    }

    /** Add a boss interrupt task (pass existing or generate new) — always at top of list */
    public addBossTask(existingTask?: TaskInfo): TaskInfo {
        const task = existingTask || generateBossTask();
        this.currentTasks.unshift(task);
        this.spawnCard(task, true);
        return task;
    }

    /** Remove a task (for delegate up) */
    public removeTask(taskId: number): void {
        const card = this.taskCards.get(taskId);
        if (card) {
            card.node.removeFromParent();
            card.node.destroy();
            this.taskCards.delete(taskId);
        }
        this.currentTasks = this.currentTasks.filter(t => t.id !== taskId);
    }

    /** Mark a task as assigned to a member */
    public markAssigned(taskId: number, memberName: string): void {
        const card = this.taskCards.get(taskId);
        if (!card) return;

        const task = this.currentTasks.find(t => t.id === taskId);
        if (task) task.assignedTo = memberName;

        // Remove card from UI so list stays clean
        card.node.removeFromParent();
        card.node.destroy();
        this.taskCards.delete(taskId);

        if (this.selectedTaskId === taskId) {
            this.selectedTaskId = -1;
        }
    }

    /** Get currently selected task */
    public getSelectedTask(): TaskInfo | null {
        if (this.selectedTaskId < 0) return null;
        return this.currentTasks.find(t => t.id === this.selectedTaskId) || null;
    }

    /** Get all unassigned tasks */
    public getUnassignedTasks(): TaskInfo[] {
        return this.currentTasks.filter(t => !t.assignedTo);
    }

    /** Get all current tasks */
    public getAllTasks(): TaskInfo[] {
        return this.currentTasks;
    }

    /** Get a TaskCard by task ID */
    public getTaskCard(taskId: number): TaskCard | null {
        return this.taskCards.get(taskId) || null;
    }

    /** Clear all task cards */
    public clearTasks(): void {
        for (const [, card] of this.taskCards) {
            card.node.removeFromParent();
            card.node.destroy();
        }
        this.taskCards.clear();
        this.currentTasks = [];
        this.selectedTaskId = -1;
    }

    /** Reset for new game */
    public reset(): void {
        this.clearTasks();
        resetTaskIds();
    }

    // ── Private ─────────────────────────────────────

    private spawnCard(task: TaskInfo, toTop: boolean = false): void {
        const node = instantiate(this.taskPrefab);
        if (toTop) {
            this.node.insertChild(node, 0);
        } else {
            this.node.addChild(node);
        }

        const card = node.getComponent(TaskCard);
        if (!card) return;

        // Set card data
        card.setTitle(
            task.isBossTask ? `[!] ${task.title}` : task.title,
            task.isBossTask ? '#FF0000' : undefined
        );
        card.setSkill(SKILL_NAMES[task.skill], SKILL_COLORS[task.skill]);
        const level = task.priority === TaskPriority.Urgent ? 3 : task.priority + 1;
        const stars = '\u2605'.repeat(level) + '\u2606'.repeat(3 - level);
        card.setPriority(stars, PRIORITY_COLORS[task.priority]);

        // Random background color
        if (card.background) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            card.background.color = new Color(r, g, b, 255);
        }

        // Drag & drop handler — returns true if assigned
        card.onDropped = (cardNode: Node, worldPos: Vec3): boolean => {
            return this.handleDrop(task, cardNode, worldPos);
        };

        this.taskCards.set(task.id, card);

        // Bounce in animation with stagger
        bounceIn(node, this.taskCards.size * 0.1);
    }

    /** Check if card was dropped on a team member. Returns true if assigned. */
    private handleDrop(task: TaskInfo, cardNode: Node, worldPos: Vec3): boolean {
        if (!this.teamSpawner) {
            console.log('[TaskSpawner] No teamSpawner reference!');
            return false;
        }

        const members = this.teamSpawner.getMembers();
        const memberNodes = this.teamSpawner.node.children;

        console.log(`[TaskSpawner] Drop at world pos: ${worldPos.x}, ${worldPos.y}. Checking ${memberNodes.length} members.`);

        for (let i = 0; i < memberNodes.length; i++) {
            const memberNode = memberNodes[i];
            const transform = memberNode.getComponent(UITransform);
            if (!transform) continue;

            // Check using world bounding box — works regardless of parent transforms
            const bbox = transform.getBoundingBoxToWorld();

            console.log(`[TaskSpawner] Member ${i}: bbox(${bbox.x}, ${bbox.y}, ${bbox.width}, ${bbox.height})`);

            if (bbox.contains(new Vec2(worldPos.x, worldPos.y))) {
                const member = members[i];
                console.log(`[TaskSpawner] Hit member: ${member.displayName}`);
                if (member && this.onTaskDroppedOnMember) {
                    this.onTaskDroppedOnMember(task, member);
                    return true;
                }
            }
        }

        console.log('[TaskSpawner] No member hit.');
        return false;
    }

    private selectTask(taskId: number): void {
        // Deselect previous
        if (this.selectedTaskId >= 0) {
            const prevCard = this.taskCards.get(this.selectedTaskId);
            if (prevCard) prevCard.deselect();
        }

        // Select new
        this.selectedTaskId = taskId;
        const card = this.taskCards.get(taskId);
        if (card) card.select();

        // Callback
        const task = this.currentTasks.find(t => t.id === taskId);
        if (task && this.onTaskClicked) {
            this.onTaskClicked(task);
        }
    }
}
