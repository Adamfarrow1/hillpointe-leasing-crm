import type { ActivityEventWithRelations } from '@crm/contracts';
import { request } from './apiClient.js';

const ACTIVITY_BASE = '/api/activity-events';

export interface ActivityFilters {
    prospectId?: string;
    unitId?: string;
    type?: string;
}

export const activityApi = {
    list: (filters?: ActivityFilters, signal?: AbortSignal) => {
        const params = new URLSearchParams();
        if (filters?.prospectId) params.set('prospectId', filters.prospectId);
        if (filters?.unitId) params.set('unitId', filters.unitId);
        if (filters?.type) params.set('type', filters.type);
        const qs = params.toString();
        return request<ActivityEventWithRelations[]>(
            `${ACTIVITY_BASE}${qs ? `?${qs}` : ''}`,
            { signal },
        );
    },

    getProspectActivity: (prospectId: string) =>
        request<ActivityEventWithRelations[]>(`/api/prospects/${prospectId}/activity`),
};
