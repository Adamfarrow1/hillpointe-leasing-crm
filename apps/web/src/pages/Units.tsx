import { useState, useMemo } from 'react';
import type { Unit, UnitStatus } from '../types';
import { mockUnits } from '../data/mockData';
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

function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

export function Units() {
    const [units, setUnits] = useState<Unit[]>(mockUnits);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);

    const filtered = useMemo(() => {
        return units.filter((u) => {
            const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [units, search, statusFilter]);

    function openCreate() {
        setEditingUnit(undefined);
        setModalOpen(true);
    }

    function openEdit(unit: Unit) {
        setEditingUnit(unit);
        setModalOpen(true);
    }

    function handleSubmit(values: UnitFormValues) {
        if (editingUnit) {
            setUnits((prev) =>
                prev.map((u) => u.id === editingUnit.id ? { ...u, ...values } : u)
            );
        } else {
            const newUnit: Unit = { id: generateId(), ...values };
            setUnits((prev) => [...prev, newUnit]);
        }
        setModalOpen(false);
    }

    function handleDelete(unit: Unit) {
        setUnits((prev) => prev.filter((u) => u.id !== unit.id));
    }

    const existingNames = units.map((u) => u.name);

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
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
                            placeholder="Search unit number…"
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
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    statusFilter === opt.value
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Unit
                </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Summary bar */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {filtered.length} of {units.length} unit{units.length !== 1 ? 's' : ''}
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

                <UnitsTable
                    units={filtered}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />

                {units.length === 0 && (
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
            </div>

            <UnitFormModal
                open={modalOpen}
                initial={editingUnit}
                existingNames={existingNames}
                onSubmit={handleSubmit}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}
