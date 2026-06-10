import type { StatusRule, RuleContext, RuleResult } from './types.js';

/** Adds n calendar days to a date and returns YYYY-MM-DD */
export function addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function emptyResult(): RuleResult {
    return { createdTasks: [], closedTasksCount: 0, activityEvents: [] };
}

export async function createTask(
    ctx: RuleContext,
    title: string,
    dueDate: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
): Promise<{ id: string; title: string; dueDate: string }> {
    const task = await ctx.tx.task.create({
        data: {
            title,
            dueDate,
            prospectId: ctx.prospect.id,
            state: 'open',
            priority,
        },
    });
    return { id: task.id, title: task.title, dueDate: task.dueDate };
}

export async function createActivity(
    ctx: RuleContext,
    summary: string,
    type: string = 'status_changed',
): Promise<{ id: string; summary: string }> {
    const event = await ctx.tx.activityEvent.create({
        data: {
            type,
            prospectId: ctx.prospect.id,
            summary,
        },
    });
    return { id: event.id, summary: event.summary };
}

export async function closeOpenTasks(ctx: RuleContext): Promise<number> {
    const result = await ctx.tx.task.updateMany({
        where: { prospectId: ctx.prospect.id, state: 'open' },
        data: { state: 'done' },
    });
    return result.count;
}

/** Registry — map status → rule */
const registry = new Map<string, StatusRule>();

export function registerRule(rule: StatusRule): void {
    registry.set(rule.status, rule);
}

export async function executeRule(ctx: RuleContext): Promise<RuleResult> {
    const rule = registry.get(ctx.newStatus);
    if (!rule) return emptyResult();
    return rule.execute(ctx);
}
