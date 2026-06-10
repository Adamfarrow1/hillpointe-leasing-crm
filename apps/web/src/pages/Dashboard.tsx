import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { PipelineFunnel } from '../components/PipelineFunnel';
import { unitsApi } from '../lib/unitsApi';
import { prospectsApi } from '../lib/prospectsApi';
import {
    mockUpcomingTours,
    mockOpenTasks,
} from '../data/mockData';
import type { ProspectStatus, Unit, Prospect } from '@crm/contracts';

function formatTourDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDueDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    useEffect(() => {
        unitsApi.list()
            .then(setUnits)
            .catch(() => { /* non-critical — KPI will show 0 */ })
            .finally(() => setUnitsLoading(false));
        prospectsApi.list()
            .then(setProspects)
            .catch(() => { /* non-critical */ })
            .finally(() => setProspectsLoading(false));
    }, []);

    const recentProspects = prospects.slice(0, 5);

    const totalProspects = prospects.length;
    const scheduledTours = mockUpcomingTours.length;
    const openTasks = mockOpenTasks.length;

    const availableUnits = units.filter((u) => u.status === 'available').length;
    const heldUnits = units.filter((u) => u.status === 'held').length;
    const leasedUnits = units.filter((u) => u.status === 'leased').length;
    const totalUnits = units.length;

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
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard
                    label="Total Prospects"
                    value={prospectsLoading ? 0 : totalProspects}
                    description={prospectsLoading ? 'Loading…' : 'Active in pipeline'}
                    accent="blue"
                />
                <KpiCard
                    label="Scheduled Tours"
                    value={scheduledTours}
                    description="Next 7 days"
                    accent="purple"
                />
                <KpiCard
                    label="Open Tasks"
                    value={openTasks}
                    description="Requiring attention"
                    accent="amber"
                />
                <KpiCard
                    label="Available Units"
                    value={unitsLoading ? 0 : availableUnits}
                    description={unitsLoading ? 'Loading…' : `of ${totalUnits} total`}
                    accent="green"
                />
            </div>

            {/* Pipeline Overview */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
                    Prospect Pipeline
                </h2>
                <PipelineFunnel counts={pipelineCounts} />
            </div>

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
                    <div className="flex items-center gap-2 px-6 py-5">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-500">Loading…</span>
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

            {/* Unit Availability */}            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Unit Availability
                    </h2>
                    {!unitsLoading && (
                        <span className="text-xs text-gray-500 font-medium">{totalUnits} total</span>
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
                            { status: 'available', count: availableUnits, bar: 'bg-green-500', label: 'Available' },
                            { status: 'held', count: heldUnits, bar: 'bg-amber-400', label: 'Held' },
                            { status: 'leased', count: leasedUnits, bar: 'bg-red-500', label: 'Leased' },
                        ] as const).map(({ status, count, bar }) => {
                            const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0;
                            return (
                                <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${bar}`} />
                                            <StatusBadge variant={status} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={`${bar} h-1.5 rounded-full transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">{pct}% of inventory</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tours + Tasks */}
            <div className="grid grid-cols-2 gap-4">
                {/* Upcoming Tours */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Upcoming Tours
                        </h2>
                        <span className="text-xs text-gray-500 font-medium">{scheduledTours} scheduled</span>
                    </div>
                    <div className="space-y-3">
                        {mockUpcomingTours.map((tour) => (
                            <div
                                key={tour.id}
                                className="flex items-start justify-between py-3 border-t border-gray-100 first:border-t-0 first:pt-0"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{tour.prospectName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{tour.unitName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{formatTourDate(tour.scheduledAt)}</p>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                    <p className="text-xs text-gray-500">{tour.agentName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Open Tasks */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Open Tasks
                        </h2>
                        <span className="text-xs text-gray-500 font-medium">{openTasks} open</span>
                    </div>
                    <div className="space-y-3">
                        {mockOpenTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-3 py-3 border-t border-gray-100 first:border-t-0 first:pt-0"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 leading-snug">{task.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {task.prospectName} · Due {formatDueDate(task.dueDate)}
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <StatusBadge variant={task.priority} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
