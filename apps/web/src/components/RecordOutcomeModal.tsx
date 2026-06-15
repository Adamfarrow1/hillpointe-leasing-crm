import { useState } from 'react';
import type { TourWithRelations } from '@crm/contracts';
import { toursApi } from '../lib/toursApi';
import type { OutcomeResponse } from '../lib/toursApi';

const OUTCOME_OPTIONS: {
    value: 'completed' | 'no_show' | 'cancelled';
    label: string;
    description: string;
    color: string;
}[] = [
        { value: 'completed', label: 'Completed', description: 'Prospect attended the tour', color: 'text-green-700' },
        { value: 'no_show', label: 'No Show', description: 'Prospect did not show up', color: 'text-red-700' },
        { value: 'cancelled', label: 'Cancelled', description: 'Tour was cancelled', color: 'text-gray-700' },
    ];

interface RecordOutcomeModalProps {
    tour: TourWithRelations;
    onRecorded: (response: OutcomeResponse) => void;
    onClose: () => void;
}

function XIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export function RecordOutcomeModal({ tour, onRecorded, onClose }: RecordOutcomeModalProps) {
    const [outcome, setOutcome] = useState<'completed' | 'no_show' | 'cancelled'>('completed');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const response = await toursApi.recordOutcome(tour.id, { outcome });
            onRecorded(response);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to record outcome');
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Record Tour Outcome</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Tour info */}
                    <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 space-y-1 border border-gray-200">
                        <p><span className="font-medium">Prospect:</span> {tour.prospect.name}</p>
                        {tour.unit && (
                            <p><span className="font-medium">Unit:</span> {tour.unit.unitNumber}</p>
                        )}
                        <p><span className="font-medium">Scheduled:</span> {formatDateTime(tour.scheduledAt)}</p>
                    </div>

                    {/* Outcome selection */}
                    <div className="space-y-2">
                        {OUTCOME_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${outcome === opt.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="outcome"
                                    value={opt.value}
                                    checked={outcome === opt.value}
                                    onChange={() => setOutcome(opt.value)}
                                    className="mt-0.5"
                                />
                                <div>
                                    <p className={`text-sm font-medium ${opt.color}`}>{opt.label}</p>
                                    <p className="text-xs text-gray-500">{opt.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    {outcome === 'completed' && (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            Marking as <strong>Completed</strong> will advance the prospect to{' '}
                            <strong>Toured</strong> and create a follow-up task automatically.
                        </p>
                    )}

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
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
