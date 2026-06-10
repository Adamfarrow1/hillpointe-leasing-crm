import type { Unit } from '@crm/contracts';
import type { ProspectStatus, TaskPriority } from '@crm/contracts';

// Lightweight mock shapes for data that has no API yet
export interface MockProspect {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: ProspectStatus;
    assignedUnit: string | null;
    createdAt: string;
}

interface MockTour {
    id: string;
    prospectName: string;
    unitName: string;
    scheduledAt: string;
    agentName: string;
}

interface MockTask {
    id: string;
    title: string;
    dueDate: string;
    prospectName: string;
    priority: TaskPriority;
}

export const mockProspects: MockProspect[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 010-1001',
        status: 'new',
        assignedUnit: null,
        createdAt: '2026-06-07',
    },
    {
        id: '2',
        name: 'Marcus Williams',
        email: 'marcus.williams@email.com',
        phone: '(555) 010-1002',
        status: 'contacted',
        assignedUnit: null,
        createdAt: '2026-06-05',
    },
    {
        id: '3',
        name: 'Emily Chen',
        email: 'emily.chen@email.com',
        phone: '(555) 010-1003',
        status: 'tour_scheduled',
        assignedUnit: 'Unit 101',
        createdAt: '2026-06-04',
    },
    {
        id: '4',
        name: 'David Rodriguez',
        email: 'david.rodriguez@email.com',
        phone: '(555) 010-1004',
        status: 'toured',
        assignedUnit: 'Unit 204',
        createdAt: '2026-05-30',
    },
    {
        id: '5',
        name: 'Jessica Park',
        email: 'jessica.park@email.com',
        phone: '(555) 010-1005',
        status: 'application',
        assignedUnit: 'Unit 312',
        createdAt: '2026-05-26',
    },
    {
        id: '6',
        name: 'Tyler Brooks',
        email: 'tyler.brooks@email.com',
        phone: '(555) 010-1006',
        status: 'leased',
        assignedUnit: 'Unit 108',
        createdAt: '2026-05-20',
    },
    {
        id: '7',
        name: 'Amanda Foster',
        email: 'amanda.foster@email.com',
        phone: '(555) 010-1007',
        status: 'lost',
        assignedUnit: null,
        createdAt: '2026-05-15',
    },
    {
        id: '8',
        name: 'Kevin Martinez',
        email: 'kevin.martinez@email.com',
        phone: '(555) 010-1008',
        status: 'contacted',
        assignedUnit: null,
        createdAt: '2026-06-06',
    },
    {
        id: '9',
        name: 'Rachel Kim',
        email: 'rachel.kim@email.com',
        phone: '(555) 010-1009',
        status: 'new',
        assignedUnit: null,
        createdAt: '2026-06-08',
    },
    {
        id: '10',
        name: 'Brandon Lee',
        email: 'brandon.lee@email.com',
        phone: '(555) 010-1010',
        status: 'tour_scheduled',
        assignedUnit: 'Unit 215',
        createdAt: '2026-06-05',
    },
];

export const mockUnits: Unit[] = [
    { id: '1', unitNumber: '101', status: 'held', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '2', unitNumber: '108', status: 'leased', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '3', unitNumber: '201', status: 'available', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '4', unitNumber: '204', status: 'held', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '5', unitNumber: '215', status: 'held', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '6', unitNumber: '308', status: 'available', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '7', unitNumber: '312', status: 'held', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '8', unitNumber: '401', status: 'available', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '9', unitNumber: '415', status: 'available', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '10', unitNumber: '420', status: 'leased', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const mockUpcomingTours: MockTour[] = [
    {
        id: '1',
        prospectName: 'Emily Chen',
        unitName: 'Unit 101',
        scheduledAt: '2026-06-10T10:00:00',
        agentName: 'Alex Thompson',
    },
    {
        id: '2',
        prospectName: 'Brandon Lee',
        unitName: 'Unit 215',
        scheduledAt: '2026-06-10T14:00:00',
        agentName: 'Mia Sanchez',
    },
    {
        id: '3',
        prospectName: 'Rachel Kim',
        unitName: 'Unit 308',
        scheduledAt: '2026-06-11T11:00:00',
        agentName: 'Alex Thompson',
    },
    {
        id: '4',
        prospectName: 'Sarah Johnson',
        unitName: 'Unit 401',
        scheduledAt: '2026-06-12T09:30:00',
        agentName: 'Mia Sanchez',
    },
];

export const mockOpenTasks: MockTask[] = [
    {
        id: '1',
        title: 'Send tour availability to Marcus Williams',
        dueDate: '2026-06-09',
        prospectName: 'Marcus Williams',
        priority: 'high',
    },
    {
        id: '2',
        title: 'Confirm tour 24h prior — Emily Chen',
        dueDate: '2026-06-09',
        prospectName: 'Emily Chen',
        priority: 'high',
    },
    {
        id: '3',
        title: 'Send tour availability to Kevin Martinez',
        dueDate: '2026-06-11',
        prospectName: 'Kevin Martinez',
        priority: 'medium',
    },
    {
        id: '4',
        title: 'Send application link to David Rodriguez',
        dueDate: '2026-06-11',
        prospectName: 'David Rodriguez',
        priority: 'medium',
    },
    {
        id: '5',
        title: 'Review application — Jessica Park',
        dueDate: '2026-06-13',
        prospectName: 'Jessica Park',
        priority: 'low',
    },
];
