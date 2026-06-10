export type ProspectStatus =
    | 'new'
    | 'contacted'
    | 'tour_scheduled'
    | 'toured'
    | 'application'
    | 'leased'
    | 'lost';

export type UnitStatus = 'available' | 'held' | 'leased';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Prospect {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: ProspectStatus;
    assignedUnit: string | null;
    createdAt: string;
}

export interface Unit {
    id: string;
    name: string;
    status: UnitStatus;
}

export interface Tour {
    id: string;
    prospectName: string;
    unitName: string;
    scheduledAt: string;
    agentName: string;
}

export interface Task {
    id: string;
    title: string;
    dueDate: string;
    prospectName: string;
    priority: TaskPriority;
}
