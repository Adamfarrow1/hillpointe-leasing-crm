import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Unit, UnitStatus } from '@crm/contracts';
import { unitsApi } from '../lib/unitsApi';
import { UnitsTable } from '../components/UnitsTable';
import { UnitFormModal } from '../components/UnitFormModal';
import type { UnitFormValues } from '../components/UnitFormModal';

type StatusFilter = UnitStatus | 'all';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'held', label: 'Held' },
    { value: 'leased', label: 'Leased' },
];

export function Units() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const loadUnits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await unitsApi.list();
            setUnits(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load units');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadUnits(); }, [loadUnits]);

    const filtered = useMemo(() => {
        return units.filter((u) => {
            const matchesSearch = u.unitNumber.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [units, search, statusFilter]);

    function openCreate() {
        setEditingUnit(undefined);
        setSaveError(null);
        setModalOpen(true);
    }

    function openEdit(unit: Unit) {
        setEditingUnit(unit);
        setSaveError(null);
        setModalOpen(true);
    }

    async function handleSubmit(values: UnitFormValues) {
        setSaving(true);
        setSaveError(null);
        try {
            if (editingUnit) {
                const updated = await unitsApi.update(editingUnit.id, values);
                setUnits((prev) => prev.map((u) => u.id === editingUnit.id ? updated : u));
            } else {
                const created = await unitsApi.create(values);
                setUnits((prev) => [...prev, created]);
            }
            setModalOpen(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(unit: Unit) {
        try {
            await unitsApi.delete(unit.id);
            setUnits((prev) => prev.filter((u) => u.id !== unit.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    }

    const existingUnitNumbers = units.map((u) => u.unitNumber);

    return (
        <div className="space-y-5">
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
            `}</style>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-up">
                <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                    {/* Search */}
                    <div className="relative w-64">
                        <svg
                            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search unit number"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === opt.value
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Unit
                </button>
            </div>

            {/* Error banner */}
            {error !== null && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => void loadUnits()}
                        className="text-xs font-medium underline hover:no-underline shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Table card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fade-up delay-100">
                {/* Summary bar */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {loading ? 'Loadingâ€¦' : `${filtered.length} of ${units.length} unit${units.length !== 1 ? 's' : ''}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                            {units.filter(u => u.status === 'available').length} available
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                            {units.filter(u => u.status === 'held').length} held
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                            {units.filter(u => u.status === 'leased').length} leased
                        </span>
                    </div>
                </div>

                {loading ? (
                    <table className="w-full text-sm animate-pulse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Unit Number</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="py-3.5 px-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                                    <td className="py-3.5 px-4"><div className="h-5 bg-gray-100 rounded-full w-16" /></td>
                                    <td className="py-3.5 px-4"><div className="h-6 bg-gray-100 rounded w-20 ml-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <>
                        <UnitsTable
                            units={filtered}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                        />
                        {units.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <p className="text-sm font-medium text-gray-900">No units yet</p>
                                <p className="text-xs text-gray-500 mt-1 mb-4">Get started by creating your first unit.</p>
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Unit
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <UnitFormModal
                open={modalOpen}
                initial={editingUnit}
                existingNames={existingUnitNumbers}
                onSubmit={handleSubmit}
                onClose={() => setModalOpen(false)}
                saving={saving}
                serverError={saveError}
            />
        </div>
    );
}
