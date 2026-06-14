import type { StatusRule } from './types.js';
import { closeOpenTasks, createActivity } from './rule-engine.js';

export const leasedRule: StatusRule = {
    status: 'leased',
    async execute(ctx) {
        let unitDisplay = '';
        if (ctx.prospect.assignedUnitId) {
            const unit = await ctx.tx.unit.update({
                where: { id: ctx.prospect.assignedUnitId },
                data: { status: 'leased' },
                select: { unitNumber: true },
            });
            unitDisplay = unit.unitNumber;
        }

        // Auto-close all open tasks for this prospect
        const closedTasksCount = await closeOpenTasks(ctx);

        const unitNote = ctx.prospect.assignedUnitId
            ? ` Unit ${unitDisplay} marked as leased.`
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
