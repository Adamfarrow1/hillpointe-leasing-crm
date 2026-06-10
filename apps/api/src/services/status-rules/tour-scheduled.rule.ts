import type { StatusRule } from './types.js';
import { addDays, createTask, createActivity } from './rule-engine.js';

export const tourScheduledRule: StatusRule = {
    status: 'tour_scheduled',
    async execute(ctx) {
        // Look for the most recently scheduled upcoming tour for this prospect
        const tour = await ctx.tx.tour.findFirst({
            where: { prospectId: ctx.prospect.id },
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
        }
        // If no tour exists yet, we still record the activity but skip the task
        // The task will be created when the tour is actually scheduled (Tier 2)

        const taskNote = createdTasks.length > 0
            ? ` Task created: "${createdTasks[0].title}"`
            : ' No tour scheduled yet — confirmation task will be created when tour is booked.';

        const activity = await createActivity(
            ctx,
            `${ctx.prospect.name} tour scheduled.${taskNote}`,
        );
        return { createdTasks, closedTasksCount: 0, activityEvents: [activity] };
    },
};
