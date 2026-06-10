import { useState, useEffect } from 'react';
import type { Unit, UnitStatus } from '../types';

const STATUS_OPTIONS: { value: UnitStatus; label: string }[] = [
    { value: 'available', label: 'Available' },
    { value: 'held', label: 'Held' },
    { value: 'leased', label: 'Leased' },
];

export interface UnitFormValues {
    name: string;
    status: UnitStatus;
}

interface UnitFormModalProps {
    open: boolean;
    initial?: Unit;
    existingNames: string[];
    onSubmit: (values: UnitFormValues) => void;
    onClose: () => void;
}

export function UnitFormModal({ open, initial, existingNames, onSubmit, onClose }: UnitFormModalProps) {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<UnitStatus>('available');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(initial?.name ?? '');
            setStatus(initial?.status ?? 'available');
            setError(null);
        }
    }, [open, initial]);

    if (!open) return null;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Unit number is required.');
            return;
        }
        const duplicate = existingNames
            .filter((n) => !initial || n !== initial.name)
            .some((n) => n.toLowerCase() === trimmed.toLowerCase());
        if (duplicate) {
            setError('A unit with that number already exists.');
            return;
        }
        onSubmit({ name: trimmed, status });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-gray-900">
                        {initial ? 'Edit Unit' : 'Create Unit'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Number
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(null); }}
                            placeholder="e.g. 101"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as UnitStatus)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {initial ? 'Save Changes' : 'Create Unit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
