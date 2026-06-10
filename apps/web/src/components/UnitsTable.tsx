import { useState } from 'react';
import type { Unit } from '../types';
import { StatusBadge } from './StatusBadge';

interface UnitsTableProps {
    units: Unit[];
    onEdit: (unit: Unit) => void;
    onDelete: (unit: Unit) => void;
}

export function UnitsTable({ units, onEdit, onDelete }: UnitsTableProps) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    function handleDeleteClick(unit: Unit) {
        setConfirmDeleteId(unit.id);
    }

    function handleConfirm(unit: Unit) {
        setConfirmDeleteId(null);
        onDelete(unit);
    }

    if (units.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">No units found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters.</p>
            </div>
        );
    }

    return (
        <>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                            Unit Number
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                            Status
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-gray-900">
                                Unit {unit.name}
                            </td>
                            <td className="py-3.5 px-4">
                                <StatusBadge variant={unit.status} />
                            </td>
                            <td className="py-3.5 px-4">
                                {confirmDeleteId === unit.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-gray-600 mr-1">Delete?</span>
                                        <button
                                            type="button"
                                            onClick={() => handleConfirm(unit)}
                                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(unit)}
                                            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(unit)}
                                            className="px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
