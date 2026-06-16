import { useState, useEffect, useMemo } from 'react';
import type { Prospect, ProspectStatus } from '@crm/contracts';
import { prospectsApi } from '../lib/prospectsApi';
import { tasksApi } from '../lib/tasksApi';
import { StatusBadge } from '../components/StatusBadge';
import { ProspectDrawer } from '../components/ProspectDrawer';
import { ProspectFormModal } from '../components/ProspectFormModal';

const ALL_STATUSES: ProspectStatus[] = [
    'new',
    'contacted',
    'tour_scheduled',
    'toured',
    'application',
    'leased',
    'lost',
];

const STATUS_LABELS: Record<ProspectStatus, string> = {
    new: 'New',
    contacted: 'Contacted',
    tour_scheduled: 'Tour Scheduled',
    toured: 'Toured',
    application: 'Application',
    leased: 'Leased',
    lost: 'Lost',
};

const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
];

function getAvatarColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
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

function ProspectRow({
    prospect,
    isSelected,
    onClick,
    animationDelay = 0,
}: {
    prospect: Prospect;
    isSelected: boolean;
    onClick: () => void;
    animationDelay?: number;
}) {
    return (
        <tr
            onClick={onClick}
            className={`cursor-pointer transition-colors hover:bg-blue-50 animate-row-in ${isSelected ? 'bg-blue-50' : ''}`}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(prospect.id)}`}
                    >
                        {getInitials(prospect.name)}
                    </div>
                    <span className="font-medium text-gray-900">{prospect.name}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="text-sm text-gray-700">{prospect.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">{prospect.phone}</div>
            </td>
            <td className="px-4 py-3">
                <StatusBadge variant={prospect.status} />
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {prospect.assignedUnit?.unitNumber ?? <span className="text-gray-400">—</span>}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(prospect.createdAt)}
            </td>
        </tr>
    );
}

export function Prospects() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all');
    const [unitFilter, setUnitFilter] = useState<string>('all');
    const [selected, setSelected] = useState<Prospect | null>(null);
    const [editTarget, setEditTarget] = useState<Prospect | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        prospectsApi.list()
            .then(setProspects)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load prospects'))
            .finally(() => setLoading(false));
    }, []);

    const statusCounts = useMemo(() => {
        const counts: Partial<Record<ProspectStatus, number>> = {};
        for (const p of prospects) {
            counts[p.status] = (counts[p.status] ?? 0) + 1;
        }
        return counts;
    }, [prospects]);

    const unitOptions = useMemo(() => {
        const nums = [...new Set(
            prospects.map((p) => p.assignedUnit?.unitNumber).filter((u): u is string => u != null && u.trim() !== ''),
        )].sort();
        return nums;
    }, [prospects]);

    const filtered = useMemo(() => {
        let list = prospects;
        if (statusFilter !== 'all') {
            list = list.filter((p) => p.status === statusFilter);
        }
        if (unitFilter === 'unassigned') {
            list = list.filter((p) => !p.assignedUnitId);
        } else if (unitFilter !== 'all') {
            list = list.filter((p) => p.assignedUnit?.unitNumber === unitFilter);
        }
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.email.toLowerCase().includes(q) ||
                    p.phone.includes(q),
            );
        }
        return list;
    }, [prospects, search, statusFilter, unitFilter]);

    function handleRowClick(p: Prospect) {
        setSelected((prev) => (prev?.id === p.id ? null : p));
    }

    function handleProspectChange(updated: Prospect) {
        setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        setSelected(updated);
    }

    function handleProspectCreated(created: Prospect) {
        setProspects((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setSelected(created);

        // Auto-create a "Reach out to <name>" task due tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueDate = tomorrow.toISOString().slice(0, 10);
        tasksApi.create({
            title: `Reach out to ${created.name}`,
            dueDate,
            prospectId: created.id,
            assignee: null,
            priority: 'medium',
        }).catch(() => {
            // non-blocking — prospect was still created successfully
        });
    }

    function handleProspectEdited(updated: Prospect) {
        setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        setSelected(updated);
        setEditTarget(null);
    }

    return (
        <div className="space-y-4">
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

            {/* Page header */}

            {/* Error banner */}
            {error && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{error}</span>
                    <button
                        onClick={() => { setError(null); setLoading(true); prospectsApi.list().then(setProspects).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false)); }}
                        className="ml-4 font-medium underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-up">
                <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                    {/* Search */}
                    <div className="relative w-72">
                        <SearchIcon />
                        <input
                            type="search"
                            placeholder="Search name, email, phone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status pill filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All
                        </button>
                        {ALL_STATUSES.filter((s) => (statusCounts[s] ?? 0) > 0).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>

                    {/* Unit filter */}
                    <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        aria-label="Filter by assigned unit"
                        className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                    >
                        <option value="all">All Units</option>
                        <option value="unassigned">Unassigned</option>
                        {unitOptions.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Prospect
                </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fade-up delay-100">
                {/* Summary bar */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {loading ? 'Loading…' : `${filtered.length} of ${prospects.length} prospect${prospects.length !== 1 ? 's' : ''}`}
                    </p>
                    {!loading && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            {(Object.entries(
                                prospects.reduce<Partial<Record<ProspectStatus, number>>>((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {})
                            ) as [ProspectStatus, number][])
                                .filter(([, n]) => n > 0)
                                .map(([s, n]) => (
                                    <span key={s}>{STATUS_LABELS[s]}: {n}</span>
                                ))}
                        </div>
                    )}
                </div>

            {loading ? (
                <table className="w-full text-sm animate-pulse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...Array(7)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                        <div className="h-3 bg-gray-200 rounded w-28" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="space-y-1.5">
                                        <div className="h-3 bg-gray-200 rounded w-36" />
                                        <div className="h-2.5 bg-gray-100 rounded w-24" />
                                    </div>
                                </td>
                                <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-full w-20" /></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-10" /></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm font-medium text-gray-900">
                        {prospects.length === 0 ? 'No prospects yet' : 'No prospects match your search'}
                    </p>
                    {prospects.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1 mb-4">Get started by adding your first prospect.</p>
                    )}
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((p, i) => (
                            <ProspectRow
                                key={p.id}
                                prospect={p}
                                isSelected={selected?.id === p.id}
                                onClick={() => handleRowClick(p)}
                                animationDelay={i * 30}
                            />
                        ))}
                    </tbody>
                </table>
            )}
            </div>

            {/* Detail drawer */}
            {selected && (
                <ProspectDrawer
                    prospect={selected}
                    onClose={() => setSelected(null)}
                    onEdit={(p) => setEditTarget(p)}
                    onProspectChange={handleProspectChange}
                />
            )}

            {/* Create modal */}
            {showCreateModal && (
                <ProspectFormModal
                    prospect={null}
                    onSaved={handleProspectCreated}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Edit modal */}
            {editTarget && (
                <ProspectFormModal
                    prospect={editTarget}
                    onSaved={handleProspectEdited}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </div>
    );
}
