import { useState, useEffect, useMemo } from 'react';
import type { Prospect, ProspectStatus } from '@crm/contracts';
import { prospectsApi } from '../lib/prospectsApi';
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

function FilterTab({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {label}
            <span className={`ml-1.5 text-xs ${active ? 'text-blue-400' : 'text-gray-400'}`}>
                {count}
            </span>
        </button>
    );
}

function ProspectRow({
    prospect,
    isSelected,
    onClick,
}: {
    prospect: Prospect;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <tr
            onClick={onClick}
            className={`cursor-pointer transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}
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
    }

    function handleProspectEdited(updated: Prospect) {
        setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        setSelected(updated);
        setEditTarget(null);
    }

    return (
        <div className="space-y-4">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {loading ? 'Loading…' : (
                        <>
                            {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}
                            {statusFilter !== 'all' && (
                                <span className="ml-1 text-gray-400">
                                    in{' '}
                                    <span className="font-medium text-gray-600">
                                        {STATUS_LABELS[statusFilter]}
                                    </span>
                                </span>
                            )}
                        </>
                    )}
                </p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <span className="text-base leading-none">+</span>
                    New Prospect
                </button>
            </div>

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

            {/* Status filter tabs */}
            <div className="flex items-center gap-0.5 border-b border-gray-200 overflow-x-auto">
                <FilterTab
                    label="All"
                    count={prospects.length}
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                />
                {ALL_STATUSES.filter((s) => (statusCounts[s] ?? 0) > 0).map((s) => (
                    <FilterTab
                        key={s}
                        label={STATUS_LABELS[s]}
                        count={statusCounts[s]!}
                        active={statusFilter === s}
                        onClick={() => setStatusFilter(s)}
                    />
                ))}
            </div>

            {/* Search + unit filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-72">
                    <SearchIcon />
                    <input
                        type="search"
                        placeholder="Search name, email, phone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    aria-label="Filter by assigned unit"
                    className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                    <option value="all">All Units</option>
                    <option value="unassigned">Unassigned</option>
                    {unitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>

            {/* Table / states */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center text-sm text-gray-500">
                    {prospects.length === 0 ? 'No prospects yet. Add one to get started.' : 'No prospects match your search.'}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Prospect
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Contact
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Unit
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Added
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((p) => (
                                <ProspectRow
                                    key={p.id}
                                    prospect={p}
                                    isSelected={selected?.id === p.id}
                                    onClick={() => handleRowClick(p)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
