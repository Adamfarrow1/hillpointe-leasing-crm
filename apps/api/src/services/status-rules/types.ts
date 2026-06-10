import type { PrismaClient, Prospect } from '@prisma/client';
import type { ProspectStatus } from '@crm/contracts';

export interface RuleContext {
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
    prospect: Prospect;
    newStatus: ProspectStatus;
}

export interface RuleResult {
    createdTasks: { id: string; title: string; dueDate: string }[];
    closedTasksCount: number;
    activityEvents: { id: string; summary: string }[];
}

export interface StatusRule {
    /** The status this rule fires for */
    status: ProspectStatus;
    execute(ctx: RuleContext): Promise<RuleResult>;
}
