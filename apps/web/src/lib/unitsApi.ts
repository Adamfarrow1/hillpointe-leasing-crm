import type { Unit, UnitStatus } from '@crm/contracts';

const BASE = '/api/units';

export interface CreateUnitPayload {
    unitNumber: string;
    status: UnitStatus;
}

export interface UpdateUnitPayload {
    unitNumber?: string;
    status?: UnitStatus;
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

export const unitsApi = {
    list: () => request<Unit[]>(BASE),

    get: (id: string) => request<Unit>(`${BASE}/${id}`),

    create: (payload: CreateUnitPayload) =>
        request<Unit>(BASE, { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: UpdateUnitPayload) =>
        request<Unit>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    delete: (id: string) =>
        request<{ success: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
};
