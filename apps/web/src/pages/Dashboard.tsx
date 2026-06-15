import { useState, useEffect, useRef } from 'react';
import { useCountUp } from '../lib/useCountUp';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { PipelineFunnel } from '../components/PipelineFunnel';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { unitsApi } from '../lib/unitsApi';
import { prospectsApi } from '../lib/prospectsApi';
import { toursApi } from '../lib/toursApi';
import { tasksApi } from '../lib/tasksApi';
import { activityApi } from '../lib/activityApi';
import type { ProspectStatus, Unit, Prospect, TourWithRelations, TaskWithProspect, ActivityEventWithRelations } from '@crm/contracts';

function formatTourDate(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });
}
function formatDueDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatRelativeDate(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function Dashboard() {
    const navigate = useNavigate();
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(true);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [prospectsLoading, setProspectsLoading] = useState(true);
    const [tours, setTours] = useState<TourWithRelations[]>([]);
    const [toursLoading, setToursLoading] = useState(true);
    const [tasks, setTasks] = useState<TaskWithProspect[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [activity, setActivity] = useState<ActivityEventWithRelations[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    function loadAll() {
        // Cancel any in-flight requests from a previous call
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const { signal } = controller;

        setLoadError(null);
        setUnitsLoading(true);
        setProspectsLoading(true);
        setToursLoading(true);
        setTasksLoading(true);
        setActivityLoading(true);

        const ignore = (err: unknown) => (err instanceof DOMException && err.name === 'AbortError');

        unitsApi.list(signal)
            .then(setUnits)
            .catch((err) => { if (!ignore(err)) setLoadError('Unable to load dashboard data. Please check that the API server is running and try again.'); })
            .finally(() => { if (!signal.aborted) setUnitsLoading(false); });
        prospectsApi.list(undefined, signal)
            .then(setProspects)
            .catch((err) => { if (!ignore(err)) setLoadError('Unable to load dashboard data. Please check that the API server is running and try again.'); })
            .finally(() => { if (!signal.aborted) setProspectsLoading(false); });
        toursApi.list(signal)
            .then(setTours)
            .catch((err) => { if (!ignore(err)) setLoadError('Unable to load dashboard data. Please check that the API server is running and try again.'); })
            .finally(() => { if (!signal.aborted) setToursLoading(false); });
        tasksApi.list(signal)
            .then(setTasks)
            .catch((err) => { if (!ignore(err)) setLoadError('Unable to load dashboard data. Please check that the API server is running and try again.'); })
            .finally(() => { if (!signal.aborted) setTasksLoading(false); });
        activityApi.list(undefined, signal)
            .then((events) => setActivity(events.slice(0, 8)))
            .catch((err) => { if (!ignore(err)) setLoadError('Unable to load dashboard data. Please check that the API server is running and try again.'); })
            .finally(() => { if (!signal.aborted) setActivityLoading(false); });
    }

    useEffect(() => {
        loadAll();
        return () => { abortRef.current?.abort(); };
    }, []);

    const now = new Date().toISOString();
    const upcomingTours = tours
        .filter((t) => !t.outcome && t.scheduledAt >= now)
        .slice(0, 5);
    const scheduledToursCount = tours.filter((t) => !t.outcome && t.scheduledAt >= now).length;
    const openTasksList = tasks
        .filter((t) => t.state === 'open')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);
    const openTasksCount = tasks.filter((t) => t.state === 'open').length;

    const recentProspects = prospects.slice(0, 5);
    const totalProspects = prospects.length;
    const availableUnits = units.filter((u) => u.status === 'available').length;
    const heldUnits = units.filter((u) => u.status === 'held').length;
    const leasedUnits = units.filter((u) => u.status === 'leased').length;
    const totalUnits = units.length;

    const animatedAvailable = useCountUp(availableUnits);
    const animatedHeld = useCountUp(heldUnits);
    const animatedLeased = useCountUp(leasedUnits);
    const animatedTotal = useCountUp(totalUnits);

    const prospectsByStatus = prospects.reduce<Partial<Record<ProspectStatus, number>>>(
        (acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; },
        {}
    );
    const pipelineCounts: Record<ProspectStatus, number> = {
        new: prospectsByStatus.new ?? 0,
        contacted: prospectsByStatus.contacted ?? 0,
        tour_scheduled: prospectsByStatus.tour_scheduled ?? 0,
        toured: prospectsByStatus.toured ?? 0,
        application: prospectsByStatus.application ?? 0,
        leased: prospectsByStatus.leased ?? 0,
        lost: prospectsByStatus.lost ?? 0,
    };

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up {
                    opacity: 0;
                    animation: fadeUp 0.5s ease-out forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
            `}</style>

            {/* Error banner */}
            {loadError && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{loadError}</span>
                    <button
                        onClick={loadAll}
                        className="ml-4 font-medium underline hover:no-underline shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4 animate-fade-up">
                <KpiCard
                    label="Total Prospects"
                    value={prospectsLoading ? 0 : totalProspects}
                    description={prospectsLoading ? 'Loading…' : loadError ? 'Unavailable' : 'Active in pipeline'}
                    accent="blue"
                />
                <KpiCard
                    label="Scheduled Tours"
                    value={toursLoading ? 0 : scheduledToursCount}
                    description={toursLoading ? 'Loading…' : loadError ? 'Unavailable' : 'Upcoming'}
                    accent="purple"
                />
                <KpiCard
                    label="Open Tasks"
                    value={tasksLoading ? 0 : openTasksCount}
                    description={tasksLoading ? 'Loading…' : loadError ? 'Unavailable' : 'Requiring attention'}
                    accent="amber"
                />
                <KpiCard
                    label="Available Units"
                    value={unitsLoading ? 0 : availableUnits}
                    description={unitsLoading ? 'Loading…' : loadError ? 'Unavailable' : `of ${totalUnits} total`}
                    accent="green"
                />
            </div>

            {/* Tours + Tasks (above pipeline) */}
            <div className="grid grid-cols-2 gap-4 animate-fade-up delay-100">
                {/* Upcoming Tours */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Upcoming Tours
                        </h2>
                        <button
                            onClick={() => navigate('/tours')}
                            className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    {toursLoading ? (
                        <div className="divide-y divide-gray-100 animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-6 py-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-200 rounded w-2/5" />
                                        <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded w-12 shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : upcomingTours.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                            No upcoming tours scheduled.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {upcomingTours.map((tour) => (
                                <div key={tour.id} className="flex items-center gap-3 px-6 py-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(tour.prospect.id)}`}>
                                        {initials(tour.prospect.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{tour.prospect.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {tour.unit ? `Unit ${tour.unit.unitNumber}` : 'No unit'} · {formatTourDate(tour.scheduledAt)}
                                        </p>
                                    </div>
                                    {tour.agentName && (
                                        <span className="text-xs text-gray-400 shrink-0">{tour.agentName}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Open Tasks */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Open Tasks
                        </h2>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    {tasksLoading ? (
                        <div className="divide-y divide-gray-100 animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3 px-6 py-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-2 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-200 rounded w-3/5" />
                                        <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                                    </div>
                                    <div className="h-5 w-12 bg-gray-100 rounded-full shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : openTasksList.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                            No open tasks.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {openTasksList.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 px-6 py-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 leading-snug truncate">{task.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {task.prospect.name} · Due {formatDueDate(task.dueDate)}
                                        </p>
                                    </div>
                                    <StatusBadge variant={task.priority} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline Overview */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-fade-up delay-200">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
                    Prospect Pipeline
                </h2>
                <PipelineFunnel counts={pipelineCounts} />
            </div>

            {/* Recent Prospects + Recent Activity */}
            <div className="grid grid-cols-2 gap-4 animate-fade-up delay-300">
                {/* Recent Prospects */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Recent Prospects
                        </h2>
                        <button
                            onClick={() => navigate('/prospects')}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    {prospectsLoading ? (
                        <div className="divide-y divide-gray-100 animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-6 py-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-200 rounded w-2/5" />
                                        <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                                    </div>
                                    <div className="h-5 w-14 bg-gray-100 rounded-full shrink-0" />
                                    <div className="h-2.5 w-10 bg-gray-100 rounded shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : recentProspects.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                            No prospects yet.{' '}
                            <button onClick={() => navigate('/prospects')} className="text-blue-600 hover:underline">
                                Add one
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentProspects.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate('/prospects')}
                                    className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(p.id)}`}>
                                        {initials(p.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{p.email}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <StatusBadge variant={p.status} />
                                    </div>
                                    <div className="text-xs text-gray-400 shrink-0 w-16 text-right">
                                        {formatRelativeDate(p.createdAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Recent Activity
                        </h2>
                        <button
                            onClick={() => navigate('/activity')}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    {activityLoading ? (
                        <div className="px-6 py-4 space-y-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 mt-0.5" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-gray-200 rounded w-4/5" />
                                        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activity.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                            No activity yet.
                        </div>
                    ) : (
                        <div className="px-6 py-4">
                            <ActivityTimeline events={activity} loading={activityLoading} compact />
                        </div>
                    )}
                </div>
            </div>

            {/* Unit Availability */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-fade-up delay-400">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Unit Availability
                    </h2>
                    {!unitsLoading && (
                        <span className="text-xs text-gray-500 font-medium tabular-nums">{animatedTotal} total</span>
                    )}
                </div>
                {unitsLoading ? (
                    <div className="flex items-center gap-2 py-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-500">Loading units…</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {([
                            { status: 'available', count: availableUnits, animated: animatedAvailable, bar: 'bg-green-500', label: 'Available' },
                            { status: 'held', count: heldUnits, animated: animatedHeld, bar: 'bg-amber-400', label: 'Held' },
                            { status: 'leased', count: leasedUnits, animated: animatedLeased, bar: 'bg-red-500', label: 'Leased' },
                        ] as const).map(({ status, count, animated, bar }) => {
                            const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0;
                            const animatedPct = totalUnits > 0 ? Math.round((animated / totalUnits) * 100) : 0;
                            return (
                                <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${bar}`} />
                                            <StatusBadge variant={status} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{animated}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={`${bar} h-1.5 rounded-full transition-none`}
                                            style={{ width: `${animatedPct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 tabular-nums">{animatedPct}% of inventory</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
