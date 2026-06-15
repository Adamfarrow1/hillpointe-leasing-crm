import type { TourWithRelations, CreateTourInput, UpdateTourInput, RecordTourOutcomeInput } from '@crm/contracts';
import { request } from './apiClient.js';

const BASE = '/api/tours';

export interface TourRuleResult {
    createdTasks: { id: string; title: string; dueDate: string }[];
    closedTasksCount: number;
    activityEvents: { id: string; summary: string }[];
}

export interface CreateTourResponse {
    tour: TourWithRelations;
    ruleResult: TourRuleResult;
}

export interface OutcomeResponse {
    tour: TourWithRelations;
    ruleResult: TourRuleResult | null;
}

export const toursApi = {
    list: (signal?: AbortSignal) => request<TourWithRelations[]>(BASE, { signal }),

    create: (payload: CreateTourInput) =>
        request<CreateTourResponse>(BASE, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (id: string, payload: UpdateTourInput) =>
        request<TourWithRelations>(`${BASE}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    recordOutcome: (id: string, payload: RecordTourOutcomeInput) =>
        request<OutcomeResponse>(`${BASE}/${id}/outcome`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
};
