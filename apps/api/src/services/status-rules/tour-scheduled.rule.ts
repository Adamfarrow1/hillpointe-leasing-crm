import type { StatusRule } from './types.js';
import { addDays, createTask, createActivity, closeOpenTasks } from './rule-engine.js';

export const tourScheduledRule: StatusRule = {
    status: 'tour_scheduled',
    async execute(ctx) {
        const closedTasksCount = await closeOpenTasks(ctx);

        // Look for the most recently scheduled upcoming tour for this prospect
        const tour = await ctx.tx.tour.findFirst({
            where: { prospectId: ctx.prospect.id, outcome: null },
            orderBy: { scheduledAt: 'desc' },
        });

        // If a tour is already booked, due date is 1 day before it.
        // If not booked yet, set a 3-day placeholder — agent should update once booked.
        const dueDate = tour
            ? addDays(new Date(tour.scheduledAt), -1)
            : addDays(new Date(), 3);

        const task = await createTask(
            ctx,
            `Confirm tour 24h prior — ${ctx.prospect.name}`,
            dueDate,
            'high',
        );

        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} moved to tour scheduled. Task created: "${task.title}"`,
        );
        return { createdTasks: [task], closedTasksCount, activityEvents: [activity] };
    },
};
