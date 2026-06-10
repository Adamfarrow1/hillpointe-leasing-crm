import { useState, useEffect, useMemo } from 'react';
import type { ActivityEventWithRelations } from '@crm/contracts';
import { activityApi } from '../lib/activityApi';
import { ActivityTimeline, formatEventType } from '../components/ActivityTimeline';

// ─── helpers ──────────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function Activity() {
    const [events, setEvents] = useState<ActivityEventWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [prospectFilter, setProspectFilter] = useState('');

    function load() {
        setLoading(true);
        setError(null);
        activityApi
            .list()
            .then(setEvents)
            .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : 'Failed to load activity'),
            )
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    // Distinct event types present in data
    const allTypes = useMemo(
        () => [...new Set(events.map((e) => e.type))].sort(),
        [events],
    );

    // Distinct prospects from events
    const uniqueProspects = useMemo(() => {
        const seen = new Set<string>();
        const results: { id: string; name: string }[] = [];
        for (const e of events) {
            if (e.prospect && !seen.has(e.prospect.id)) {
                seen.add(e.prospect.id);
                results.push({ id: e.prospect.id, name: e.prospect.name });
            }
        }
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [events]);

    // Client-side filtered list
    const filtered = useMemo(() => {
        return events.filter((e) => {
            if (typeFilter && e.type !== typeFilter) return false;
            if (prospectFilter && e.prospectId !== prospectFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const inSummary = e.summary.toLowerCase().includes(q);
                const inProspect = e.prospect?.name.toLowerCase().includes(q) ?? false;
                const inUnit = e.unit?.unitNumber.toLowerCase().includes(q) ?? false;
                if (!inSummary && !inProspect && !inUnit) return false;
            }
            return true;
        });
    }, [events, typeFilter, prospectFilter, search]);

    // Summary counts
    const statusChanges = events.filter((e) => e.type === 'status_changed').length;
    const taskEvents = events.filter((e) => e.type.startsWith('task_')).length;
    const tourEvents = events.filter((e) => e.type.startsWith('tour_')).length;

    const hasFilters = search !== '' || typeFilter !== '' || prospectFilter !== '';

    return (
        <div className="space-y-6">
            {/* Subtitle */}
            <p className="text-sm text-gray-500">
                Audit trail of prospect, unit, task, and tour workflow events.
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
                <SummaryCard label="Total Events" value={events.length} accent="text-gray-800" />
                <SummaryCard label="Status Changes" value={statusChanges} accent="text-blue-600" />
                <SummaryCard label="Task Events" value={taskEvents} accent="text-purple-600" />
                <SummaryCard label="Tour Events" value={tourEvents} accent="text-amber-600" />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={load} className="ml-4 font-medium underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
                {/* Text search */}
                <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search summary, prospect, unit…"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Event type */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Types</option>
                    {allTypes.map((t) => (
                        <option key={t} value={t}>{formatEventType(t)}</option>
                    ))}
                </select>

                {/* Prospect */}
                {uniqueProspects.length > 0 && (
                    <select
                        value={prospectFilter}
                        onChange={(e) => setProspectFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Prospects</option>
                        {uniqueProspects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}

                {/* Clear */}
                {hasFilters && (
                    <button
                        onClick={() => { setSearch(''); setTypeFilter(''); setProspectFilter(''); }}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Result count when filtering */}
            {!loading && hasFilters && (
                <p className="text-sm text-gray-500">
                    Showing {filtered.length} of {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <ActivityTimeline
                    events={filtered}
                    loading={loading}
                    emptyMessage={
                        hasFilters
                            ? 'No events match your filters.'
                            : 'No activity has been recorded yet. Activity will appear as prospects move through the leasing pipeline.'
                    }
                />
            </div>
        </div>
    );
}

