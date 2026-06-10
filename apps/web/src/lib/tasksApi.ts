import type { TaskWithProspect, UpdateTaskInput } from '@crm/contracts';

const BASE = '/api/tasks';


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

export const tasksApi = {
    list: () => request<TaskWithProspect[]>(BASE),

    update: (id: string, payload: UpdateTaskInput) =>
        request<TaskWithProspect>(`${BASE}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    delete: async (id: string): Promise<void> => {
        const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const body: unknown = await res.json().catch(() => null);
            const message =
                typeof body === 'object' && body !== null && 'error' in body
                    ? String((body as { error: unknown }).error)
                    : `HTTP ${res.status}`;
            throw new Error(message);
        }
    },

    complete: (id: string) =>
        request<TaskWithProspect>(`${BASE}/${id}/complete`, { method: 'PATCH' }),

    reopen: (id: string) =>
        request<TaskWithProspect>(`${BASE}/${id}/reopen`, { method: 'PATCH' }),
};
