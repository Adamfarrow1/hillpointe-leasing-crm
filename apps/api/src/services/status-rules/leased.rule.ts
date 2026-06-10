import type { StatusRule } from './types.js';
import { closeOpenTasks, createActivity } from './rule-engine.js';

export const leasedRule: StatusRule = {
    status: 'leased',
    async execute(ctx) {
        // Mark assigned unit as leased if prospect has one
        if (ctx.prospect.assignedUnit) {
            await ctx.tx.unit.updateMany({
                where: { unitNumber: ctx.prospect.assignedUnit },
                data: { status: 'leased' },
            });
        }

        // Auto-close all open tasks for this prospect
        const closedTasksCount = await closeOpenTasks(ctx);

        const unitNote = ctx.prospect.assignedUnit
            ? ` Unit ${ctx.prospect.assignedUnit} marked as leased.`
            : '';
        const tasksNote = closedTasksCount > 0
            ? ` ${closedTasksCount} open task(s) auto-closed.`
            : '';

        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} signed lease.${unitNote}${tasksNote}`,
            'unit_leased',
        );
        return { createdTasks: [], closedTasksCount, activityEvents: [activity] };
    },
};
