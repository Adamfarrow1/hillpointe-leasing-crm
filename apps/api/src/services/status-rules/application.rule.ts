import type { StatusRule } from './types.js';
import { addDays, createTask, createActivity, closeOpenTasks } from './rule-engine.js';

export const applicationRule: StatusRule = {
    status: 'application',
    async execute(ctx) {
        const closedTasksCount = await closeOpenTasks(ctx);
        const task = await createTask(
            ctx,
            `Review application — ${ctx.prospect.name}`,
            addDays(new Date(), 3),
            'medium',
        );
        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} submitted application. Task created: "${task.title}"`,
        );
        return { createdTasks: [task], closedTasksCount, activityEvents: [activity] };
    },
};
