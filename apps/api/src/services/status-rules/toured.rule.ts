import type { StatusRule } from './types.js';
import { addDays, createTask, createActivity, closeOpenTasks } from './rule-engine.js';

export const touredRule: StatusRule = {
    status: 'toured',
    async execute(ctx) {
        const closedTasksCount = await closeOpenTasks(ctx);
        const task = await createTask(
            ctx,
            `Send application link to ${ctx.prospect.name}`,
            addDays(new Date(), 1),
            'high',
        );
        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} completed tour. Task created: "${task.title}"`,
        );
        return { createdTasks: [task], closedTasksCount, activityEvents: [activity] };
    },
};
