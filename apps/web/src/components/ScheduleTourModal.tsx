import { useState, useEffect } from 'react';
import type { TourWithRelations, CreateTourInput, UpdateTourInput } from '@crm/contracts';
import { CreateTourSchema, UpdateTourSchema } from '@crm/contracts';
import type { Prospect, Unit } from '@crm/contracts';
import { prospectsApi } from '../lib/prospectsApi';
import { unitsApi } from '../lib/unitsApi';
import { toursApi } from '../lib/toursApi';
import type { CreateTourResponse } from '../lib/toursApi';

interface ScheduleTourModalProps {
    /** Pass to reschedule an existing tour. Omit when creating new. */
    existingTour?: TourWithRelations;
    onCreated?: (response: CreateTourResponse) => void;
    onRescheduled?: (tour: TourWithRelations) => void;
    onClose: () => void;
}

/** Convert an ISO string to the "YYYY-MM-DDTHH:mm" format required by datetime-local inputs */
function toDatetimeLocalValue(isoString: string): string {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

function XIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

export function ScheduleTourModal({ existingTour, onCreated, onRescheduled, onClose }: ScheduleTourModalProps) {
    const isReschedule = existingTour !== undefined;

    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [prospectId, setProspectId] = useState(existingTour?.prospectId ?? '');
    const [unitId, setUnitId] = useState(existingTour?.unitId ?? '');
    const [scheduledAt, setScheduledAt] = useState(
        existingTour ? toDatetimeLocalValue(existingTour.scheduledAt) : '',
    );
    const [agentName, setAgentName] = useState(existingTour?.agentName ?? '');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([prospectsApi.list(), unitsApi.list()])
            .then(([p, u]) => {
                // Only show active prospects and available/held units in dropdowns
                setProspects(p.filter((pr) => pr.status !== 'leased' && pr.status !== 'lost'));
                setUnits(u.filter((un) => un.status === 'available' || un.status === 'held'));
            })
            .catch(() => { /* dropdowns stay empty */ })
            .finally(() => setLoadingOptions(false));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!scheduledAt) { setError('Please select a date and time'); return; }

        setSaving(true);
        setError(null);

        const scheduledAtISO = new Date(scheduledAt).toISOString();

        try {
            if (isReschedule && existingTour) {
                const payload: UpdateTourInput = {
                    scheduledAt: scheduledAtISO,
                    unitId: unitId || undefined,
                    agentName: agentName.trim() || undefined,
                };
                const parsed = UpdateTourSchema.safeParse(payload);
                if (!parsed.success) {
                    setError(parsed.error.issues[0]?.message ?? 'Invalid form data');
                    setSaving(false);
                    return;
                }
                const updated = await toursApi.update(existingTour.id, parsed.data);
                onRescheduled?.(updated);
            } else {
                const payload: CreateTourInput = {
                    prospectId,
                    unitId,
                    scheduledAt: scheduledAtISO,
                    agentName: agentName.trim() || undefined,
                };
                const parsed = CreateTourSchema.safeParse(payload);
                if (!parsed.success) {
                    setError(parsed.error.issues[0]?.message ?? 'Invalid form data');
                    setSaving(false);
                    return;
                }
                const response = await toursApi.create(parsed.data);
                onCreated?.(response);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save tour');
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">
                        {isReschedule ? 'Reschedule Tour' : 'Schedule Tour'}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Prospect */}
                    <div>
                        <label htmlFor="tour-prospect" className="block text-xs font-medium text-gray-700 mb-1">
                            Prospect <span className="text-red-500">*</span>
                        </label>
                        {isReschedule ? (
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {existingTour.prospect.name}
                            </p>
                        ) : (
                            <select
                                id="tour-prospect"
                                value={prospectId}
                                onChange={(e) => setProspectId(e.target.value)}
                                disabled={loadingOptions}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                            >
                                <option value="">Select prospect…</option>
                                {prospects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {p.status.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Unit */}
                    <div>
                        <label htmlFor="tour-unit" className="block text-xs font-medium text-gray-700 mb-1">
                            Unit <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="tour-unit"
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                            disabled={loadingOptions}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                        >
                            <option value="">Select unit…</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.unitNumber} ({u.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div>
                        <label htmlFor="tour-time" className="block text-xs font-medium text-gray-700 mb-1">
                            Scheduled Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tour-time"
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Agent name */}
                    <div>
                        <label htmlFor="tour-agent" className="block text-xs font-medium text-gray-700 mb-1">
                            Agent Name <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="tour-agent"
                            type="text"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="Leasing agent name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || loadingOptions}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {isReschedule ? 'Save Changes' : 'Schedule Tour'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
