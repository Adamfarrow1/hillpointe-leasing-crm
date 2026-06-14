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

        const createdTasks: { id: string; title: string; dueDate: string }[] = [];

        if (tour) {
            const tourDate = new Date(tour.scheduledAt);
            const dueDate = addDays(tourDate, -1);
            const task = await createTask(
                ctx,
                `Confirm tour 24h prior — ${ctx.prospect.name}`,
                dueDate,
                'high',
            );
            createdTasks.push(task);
        } else {
            // No tour booked yet — create a reminder to schedule one
            const task = await createTask(
                ctx,
                `Schedule a tour for ${ctx.prospect.name}`,
                addDays(new Date(), 1),
                'high',
            );
            createdTasks.push(task);
        }

        const taskNote = ` Task created: "${createdTasks[0].title}"`;

        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} moved to tour scheduled.${taskNote}`,
        );
        return { createdTasks, closedTasksCount, activityEvents: [activity] };
    },
};
