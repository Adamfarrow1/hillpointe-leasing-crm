import type { Unit, UnitStatus } from '@crm/contracts';
import { request } from './apiClient.js';

const BASE = '/api/units';

export interface CreateUnitPayload {
    unitNumber: string;
    status: UnitStatus;
}

export interface UpdateUnitPayload {
    unitNumber?: string;
    status?: UnitStatus;
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
