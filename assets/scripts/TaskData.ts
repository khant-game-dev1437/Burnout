import { SkillType } from './TeamMember';

export enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

export interface TaskInfo {
    id: number;
    title: string;
    skill: SkillType;
    priority: TaskPriority;
    difficulty: number;        // 1-3
    isBossTask: boolean;
    assignedTo: string | null;
}

// ── Task Templates ──────────────────────────────────

const TASK_POOL = [
    { title: 'Fix Login Bug', skill: SkillType.Technical },
    { title: 'API Integration', skill: SkillType.Technical },
    { title: 'Code Review', skill: SkillType.Technical },
    { title: 'Landing Page Redesign', skill: SkillType.Creative },
    { title: 'Social Media Campaign', skill: SkillType.Creative },
    { title: 'Pitch Deck', skill: SkillType.Creative },
    { title: 'Client Call', skill: SkillType.Communication },
    { title: 'Team Standup', skill: SkillType.Communication },
    { title: 'Conflict Mediation', skill: SkillType.Communication },
    { title: 'UI Wireframes', skill: SkillType.Design },
    { title: 'Icon Set', skill: SkillType.Design },
    { title: 'App Redesign', skill: SkillType.Design },
];

const BOSS_TASKS = [
    { title: 'CEO Presentation - ASAP', skill: SkillType.Communication },
    { title: 'Emergency Hotfix', skill: SkillType.Technical },
    { title: 'Investor Demo', skill: SkillType.Creative },
    { title: 'Compliance Deadline', skill: SkillType.Design },
];

// ── Generation ──────────────────────────────────────

let nextId = 1;

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPriority(): TaskPriority {
    const roll = Math.random();
    if (roll < 0.15) return TaskPriority.High;
    if (roll < 0.5) return TaskPriority.Medium;
    return TaskPriority.Low;
}

export function generateDailyTasks(count: number = 5): TaskInfo[] {
    const tasks: TaskInfo[] = [];
    const used = new Set<string>();

    for (let i = 0; i < count; i++) {
        // Step 1: pick a random task from the pool
        let t = pickRandom(TASK_POOL);

        // Step 2: if we already picked this task today, keep picking until we find a new one
        while (used.has(t.title)) {
            t = pickRandom(TASK_POOL);
        }

        // Step 3: mark this task as used so we don't pick it again
        used.add(t.title);

        // Step 4: create the task
        const priority = randomPriority();
        tasks.push({
            id: nextId++,
            title: t.title,
            skill: t.skill,
            priority,
            difficulty: priority === TaskPriority.High ? 2 : 1,
            isBossTask: false,
            assignedTo: null,
        });
    }
    return tasks;
}

export function generateBossTask(): TaskInfo {
    const t = pickRandom(BOSS_TASKS);
    return {
        id: nextId++,
        title: t.title,
        skill: t.skill,
        priority: TaskPriority.Urgent,
        difficulty: 3,
        isBossTask: true,
        assignedTo: null,
    };
}

export function resetTaskIds(): void {
    nextId = 1;
}
