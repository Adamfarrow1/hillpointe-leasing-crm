import type { Prospect, ProspectStatus } from '@crm/contracts';

const BASE = '/api/prospects';

export interface CreateProspectPayload {
    name: string;
    email: string;
    phone: string;
    status?: ProspectStatus;
    assignedUnit?: string | null;
}

export interface UpdateProspectPayload {
    name?: string;
    email?: string;
    phone?: string;
    status?: ProspectStatus;
    assignedUnit?: string | null;
}

export interface StatusTransitionResult {
    prospect: Prospect;
    createdTasks: { id: string; title: string; dueDate: string }[];
    closedTasksCount: number;
    activityEvents: { id: string; summary: string }[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    const body: unknown = await res.json();
    if (!res.ok) {
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String((body as { error: unknown }).error)
                : `HTTP ${res.status}`;
        throw new Error(message);
    }
    return body as T;
}

export const prospectsApi = {
    list: (status?: ProspectStatus) => {
        const url = status ? `${BASE}?status=${status}` : BASE;
        return request<Prospect[]>(url);
    },

    get: (id: string) => request<Prospect>(`${BASE}/${id}`),

    create: (payload: CreateProspectPayload) =>
        request<Prospect>(BASE, { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateProspectPayload) =>
        request<Prospect>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    changeStatus: (id: string, status: ProspectStatus) =>
        request<StatusTransitionResult>(`${BASE}/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    delete: (id: string) =>
        request<{ success: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
};
