import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { PipelineFunnel } from '../components/PipelineFunnel';
import {
    mockProspects,
    mockUnits,
    mockUpcomingTours,
    mockOpenTasks,
} from '../data/mockData';
import type { ProspectStatus } from '../types';

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

export function Dashboard() {
    const totalProspects = mockProspects.length;
    const scheduledTours = mockUpcomingTours.length;
    const openTasks = mockOpenTasks.length;
    const availableUnits = mockUnits.filter((u) => u.status === 'available').length;

    const prospectsByStatus = mockProspects.reduce<Partial<Record<ProspectStatus, number>>>(
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
                    value={totalProspects}
                    description="Active in pipeline"
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
                    value={availableUnits}
                    description="Ready to lease"
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
