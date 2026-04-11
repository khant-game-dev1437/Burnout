import { SkillType } from './TeamMember';

// ── Skill Display ──────────────────────────────────

export const SKILL_NAMES = ['Technical', 'Creative', 'Communication', 'Design'];

export const SKILL_COLORS: Record<number, string> = {
    [SkillType.Technical]: '#409EFF',
    [SkillType.Creative]: '#E6A23C',
    [SkillType.Communication]: '#67C23A',
    [SkillType.Design]: '#B266FF',
};

// ── Member Colors ──────────────────────────────────

export const MEMBER_NAMES = ['Min Khant', 'Leo', 'Timber Saw', 'Chris'];

export const MEMBER_COLORS: Record<string, string> = {
    'Min Khant': '#3498DB',
    'Leo': '#E67E22',
    'Timber Saw': '#2ECC71',
    'Chris': '#9B59B6',
};

// ── Status Colors ──────────────────────────────────

export const COLOR_GREEN = '#2ECC71';
export const COLOR_YELLOW = '#F39C12';
export const COLOR_RED = '#E74C3C';
export const COLOR_BLUE = '#3498DB';

// ── Score Thresholds ───────────────────────────────

export function scoreColor(score: number): string {
    if (score >= 70) return COLOR_GREEN;
    if (score >= 40) return COLOR_YELLOW;
    return COLOR_RED;
}
