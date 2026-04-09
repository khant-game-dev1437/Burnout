import { _decorator, Component, Prefab, instantiate, Node, Color } from 'cc';
import { TaskInfo, TaskPriority, generateDailyTasks, generateBossTask, resetTaskIds } from './TaskData';
import { SkillType } from './TeamMember';
import { TaskCard } from './TaskCard';

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

    private taskCards: Map<number, TaskCard> = new Map();
    private currentTasks: TaskInfo[] = [];
    private selectedTaskId: number = -1;

    // Callback — GameManager sets this
    public onTaskClicked: ((task: TaskInfo) => void) | null = null;

    start(): void {
        this.spawnDailyTasks(5);
    }

    /** Spawn tasks for a new day */
    public spawnDailyTasks(count: number = 5): TaskInfo[] {
        this.clearTasks();
        this.currentTasks = generateDailyTasks(count);

        for (let i = 0; i < this.currentTasks.length; i++) {
            this.spawnCard(this.currentTasks[i]);
        }

        return this.currentTasks;
    }

    /** Add a boss interrupt task */
    public addBossTask(): TaskInfo {
        const task = generateBossTask();
        this.currentTasks.push(task);
        this.spawnCard(task);
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

        card.setTitle(`${task?.title} → ${memberName}`);
        card.dim();

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

    private spawnCard(task: TaskInfo): void {
        const node = instantiate(this.taskPrefab);
        this.node.addChild(node);

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

        // Click handler
        node.on(Node.EventType.TOUCH_END, () => {
            if (task.assignedTo) return;
            this.selectTask(task.id);
        });

        this.taskCards.set(task.id, card);
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
