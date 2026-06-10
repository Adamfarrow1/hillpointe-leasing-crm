import type { StatusRule } from './types.js';
import { addDays, createTask, createActivity } from './rule-engine.js';

export const contactedRule: StatusRule = {
    status: 'contacted',
    async execute(ctx) {
        const task = await createTask(
            ctx,
            `Send tour availability to ${ctx.prospect.name}`,
            addDays(new Date(), 2),
            'high',
        );
        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} was contacted. Task created: "${task.title}"`,
        );
        return { createdTasks: [task], closedTasksCount: 0, activityEvents: [activity] };
    },
};
