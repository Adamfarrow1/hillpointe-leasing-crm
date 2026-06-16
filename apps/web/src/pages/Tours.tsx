import { useState, useEffect, useMemo } from 'react';
import type { TourWithRelations } from '@crm/contracts';
import { toursApi } from '../lib/toursApi';
import type { TourRuleResult } from '../lib/toursApi';
import { ScheduleTourModal } from '../components/ScheduleTourModal';
import { RecordOutcomeModal } from '../components/RecordOutcomeModal';
import { useCountUp } from '../lib/useCountUp';

// ─── helpers ──────────────────────────────────────────────────────────────────

const NOW_ISO = new Date().toISOString();

function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function isPast(isoString: string): boolean {
    return isoString < NOW_ISO;
}

// ─── outcome badge ─────────────────────────────────────────────────────────────

const OUTCOME_BADGE: Record<string, { label: string; cls: string }> = {
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
    no_show: { label: 'No Show', cls: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
};

function OutcomeBadge({ outcome }: { outcome: string | null }) {
    if (!outcome) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Scheduled
            </span>
        );
    }
    const config = OUTCOME_BADGE[outcome] ?? { label: outcome, cls: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.cls}`}>
            {config.label}
        </span>
    );
}

// ─── summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
    const animated = useCountUp(value);
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${accent}`} />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-3xl font-bold mt-1 tabular-nums text-gray-900">{animated}</p>
        </div>
    );
}

// ─── automation banner ────────────────────────────────────────────────────────

function AutomationBanner({
    result,
    onDismiss,
}: {
    result: TourRuleResult;
    onDismiss: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-xs">
            <div className="min-w-0">
                <p className="font-semibold text-green-700 mb-1">✓ Prospect advanced to Toured — automation ran</p>
                {result.createdTasks.map((t) => (
                    <p key={t.id} className="text-green-600 truncate">+ Task: "{t.title}" (due {t.dueDate})</p>
                ))}
                {result.closedTasksCount > 0 && (
                    <p className="text-green-600">✓ {result.closedTasksCount} task(s) auto-closed</p>
                )}
            </div>
            <button onClick={onDismiss} className="text-green-500 hover:text-green-700 shrink-0">✕</button>
        </div>
    );
}

// ─── icons ────────────────────────────────────────────────────────────────────

function CalendarPlusIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM12 11v4m-2-2h4" />
        </svg>
    );
}
function PencilIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}
function ClipboardCheckIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function Tours() {
    const [tours, setTours] = useState<TourWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [automationBanner, setAutomationBanner] = useState<TourRuleResult | null>(null);

    // Modal state
    const [schedulingNew, setSchedulingNew] = useState(false);
    const [reschedulingTour, setReschedulingTour] = useState<TourWithRelations | null>(null);
    const [recordingOutcomeFor, setRecordingOutcomeFor] = useState<TourWithRelations | null>(null);

    function load() {
        setLoading(true);
        setError(null);
        toursApi
            .list()
            .then(setTours)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load tours'))
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    // ── derived counts ──
    const upcomingCount = useMemo(
        () => tours.filter((t) => !t.outcome && !isPast(t.scheduledAt)).length,
        [tours],
    );
    const completedCount = useMemo(() => tours.filter((t) => t.outcome === 'completed').length, [tours]);
    const noShowCount = useMemo(() => tours.filter((t) => t.outcome === 'no_show').length, [tours]);
    const cancelledCount = useMemo(() => tours.filter((t) => t.outcome === 'cancelled').length, [tours]);

    function handleCreated(response: { tour: TourWithRelations; ruleResult: TourRuleResult }) {
        setTours((prev) => [...prev, response.tour].sort(
            (a, b) => a.scheduledAt.localeCompare(b.scheduledAt),
        ));
        setSchedulingNew(false);
        if (response.ruleResult.createdTasks.length > 0 || response.ruleResult.closedTasksCount > 0) {
            setAutomationBanner(response.ruleResult);
        }
    }

    function handleRescheduled(updated: TourWithRelations) {
        setTours((prev) => prev.map((t) => t.id === updated.id ? updated : t));
        setReschedulingTour(null);
    }

    function handleOutcomeRecorded(response: { tour: TourWithRelations; ruleResult: TourRuleResult | null }) {
        setTours((prev) => prev.map((t) => t.id === response.tour.id ? response.tour : t));
        setRecordingOutcomeFor(null);
        if (response.ruleResult && (response.ruleResult.createdTasks.length > 0 || response.ruleResult.closedTasksCount > 0)) {
            setAutomationBanner(response.ruleResult);
        }
    }

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up {
                    opacity: 0;
                    animation: fadeUp 0.4s ease-out forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                @keyframes rowIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-row-in {
                    opacity: 0;
                    animation: rowIn 0.3s ease-out forwards;
                }
            `}</style>

            {/* Subtitle + action */}
            <div className="flex items-center justify-between animate-fade-up">
                <p className="text-sm text-gray-500">
                    Schedule, reschedule, and record leasing tour outcomes.
                </p>
                <button
                    onClick={() => setSchedulingNew(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <CalendarPlusIcon />
                    Schedule Tour
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 animate-fade-up delay-100">
                <SummaryCard label="Upcoming" value={upcomingCount} accent="bg-blue-500" />
                <SummaryCard label="Completed" value={completedCount} accent="bg-green-500" />
                <SummaryCard label="No Shows" value={noShowCount} accent="bg-red-500" />
                <SummaryCard label="Cancelled" value={cancelledCount} accent="bg-gray-400" />
            </div>

            {/* Automation banner */}
            {automationBanner && (
                <AutomationBanner result={automationBanner} onDismiss={() => setAutomationBanner(null)} />
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={load} className="ml-4 font-medium underline hover:no-underline">Retry</button>
                </div>
            )}

            {/* Tour list */}
            <div className="animate-fade-up delay-200">
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1.5">
                                            <div className="h-3 bg-gray-200 rounded w-32" />
                                            <div className="h-2.5 bg-gray-100 rounded w-40" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-12" /></td>
                                    <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                                    <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-full w-20" /></td>
                                    <td className="px-4 py-3"><div className="h-6 bg-gray-100 rounded w-20 ml-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : tours.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        No tours scheduled yet. Click <strong>Schedule Tour</strong> to add the first one.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tours.map((tour, i) => {
                                const hasOutcome = tour.outcome !== null;
                                const overdue = !hasOutcome && isPast(tour.scheduledAt);

                                return (
                                    <tr
                                        key={tour.id}
                                        className={`hover:bg-gray-50 transition-colors animate-row-in ${overdue ? 'bg-amber-50' : ''}`}
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{tour.prospect.name}</p>
                                            <p className="text-xs text-gray-400">{tour.prospect.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {tour.unit ? tour.unit.unitNumber : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={overdue ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                                {formatDateTime(tour.scheduledAt)}
                                            </span>
                                            {overdue && (
                                                <span className="ml-1.5 text-xs text-amber-600">(past)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {tour.agentName ?? <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <OutcomeBadge outcome={tour.outcome} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {!hasOutcome && (
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setReschedulingTour(tour)}
                                                        title="Reschedule"
                                                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <PencilIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => setRecordingOutcomeFor(tour)}
                                                        title="Record outcome"
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        <ClipboardCheckIcon />
                                                        Outcome
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            </div>

            {/* Schedule Tour modal */}
            {schedulingNew && (
                <ScheduleTourModal
                    onCreated={handleCreated}
                    onClose={() => setSchedulingNew(false)}
                />
            )}

            {/* Reschedule modal */}
            {reschedulingTour && (
                <ScheduleTourModal
                    existingTour={reschedulingTour}
                    onRescheduled={handleRescheduled}
                    onClose={() => setReschedulingTour(null)}
                />
            )}

            {/* Record Outcome modal */}
            {recordingOutcomeFor && (
                <RecordOutcomeModal
                    tour={recordingOutcomeFor}
                    onRecorded={handleOutcomeRecorded}
                    onClose={() => setRecordingOutcomeFor(null)}
                />
            )}
        </div>
    );
}

