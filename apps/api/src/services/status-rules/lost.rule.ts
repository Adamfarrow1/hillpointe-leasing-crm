import type { StatusRule } from './types.js';
import { closeOpenTasks, createActivity } from './rule-engine.js';

export const lostRule: StatusRule = {
    status: 'lost',
    async execute(ctx) {
        const closedTasksCount = await closeOpenTasks(ctx);

        const tasksNote = closedTasksCount > 0
            ? ` ${closedTasksCount} open task(s) auto-closed.`
            : '';

        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} marked as lost.${tasksNote}`,
        );
        return { createdTasks: [], closedTasksCount, activityEvents: [activity] };
    },
};
