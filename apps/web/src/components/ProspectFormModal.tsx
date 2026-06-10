import { useState, useEffect } from 'react';
import type { Prospect, ProspectStatus } from '@crm/contracts';
import { prospectsApi } from '../lib/prospectsApi';
import type { CreateProspectPayload, UpdateProspectPayload } from '../lib/prospectsApi';

const STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'tour_scheduled', label: 'Tour Scheduled' },
    { value: 'toured', label: 'Toured' },
    { value: 'application', label: 'Application' },
    { value: 'leased', label: 'Leased' },
    { value: 'lost', label: 'Lost' },
];

interface ProspectFormModalProps {
    /** Pass a prospect to edit, or null to create new */
    prospect: Prospect | null;
    onSaved: (prospect: Prospect) => void;
    onClose: () => void;
}

export function ProspectFormModal({ prospect, onSaved, onClose }: ProspectFormModalProps) {
    const isEditing = prospect !== null;

    const [name, setName] = useState(prospect?.name ?? '');
    const [email, setEmail] = useState(prospect?.email ?? '');
    const [phone, setPhone] = useState(prospect?.phone ?? '');
    const [status, setStatus] = useState<ProspectStatus>(prospect?.status ?? 'new');
    const [assignedUnit, setAssignedUnit] = useState(prospect?.assignedUnit ?? '');

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'phone' | 'server', string>>>({});

    // Keep form in sync if the prospect prop changes (e.g. after a status update externally)
    useEffect(() => {
        if (prospect) {
            setName(prospect.name);
            setEmail(prospect.email);
            setPhone(prospect.phone);
            setStatus(prospect.status);
            setAssignedUnit(prospect.assignedUnit ?? '');
        }
    }, [prospect?.id]);

    function validate() {
        const next: typeof errors = {};
        if (!name.trim()) next.name = 'Name is required';
        if (!email.trim()) next.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Invalid email address';
        if (!phone.trim()) next.phone = 'Phone is required';
        return next;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            let saved: Prospect;
            if (isEditing) {
                const payload: UpdateProspectPayload = {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    status,
                    assignedUnit: assignedUnit.trim() || null,
                };
                saved = await prospectsApi.update(prospect.id, payload);
            } else {
                const payload: CreateProspectPayload = {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    status,
                    assignedUnit: assignedUnit.trim() || null,
                };
                saved = await prospectsApi.create(payload);
            }
            onSaved(saved);
        } catch (err: unknown) {
            setErrors({ server: err instanceof Error ? err.message : 'Save failed' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">
                        {isEditing ? 'Edit Prospect' : 'New Prospect'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="px-5 py-4 space-y-4">
                        {errors.server && (
                            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {errors.server}
                            </div>
                        )}

                        <Field label="Full Name" error={errors.name}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jane Smith"
                                className={inputClass(!!errors.name)}
                                autoFocus
                            />
                        </Field>

                        <Field label="Email" error={errors.email}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jane@example.com"
                                className={inputClass(!!errors.email)}
                            />
                        </Field>

                        <Field label="Phone" error={errors.phone}>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 000-0000"
                                className={inputClass(!!errors.phone)}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Status">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                                    className={inputClass(false)}
                                >
                                    {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Assigned Unit">
                                <input
                                    type="text"
                                    value={assignedUnit}
                                    onChange={(e) => setAssignedUnit(e.target.value)}
                                    placeholder="Unit 101"
                                    className={inputClass(false)}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {isEditing ? 'Save Changes' : 'Create Prospect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function inputClass(hasError: boolean) {
    return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
        hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
