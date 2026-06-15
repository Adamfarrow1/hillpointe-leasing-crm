import { useState, useEffect } from 'react';
import type { TaskWithProspect, TaskPriority, TaskState } from '@crm/contracts';
import { UpdateTaskSchema } from '@crm/contracts';
import { tasksApi } from '../lib/tasksApi';

interface TaskEditModalProps {
    task: TaskWithProspect;
    onSaved: (updated: TaskWithProspect) => void;
    onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

const STATE_OPTIONS: { value: TaskState; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'done', label: 'Done' },
];

export function TaskEditModal({ task, onSaved, onClose }: TaskEditModalProps) {
    const [title, setTitle] = useState(task.title);
    const [dueDate, setDueDate] = useState(task.dueDate);
    const [assignee, setAssignee] = useState(task.assignee ?? '');
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [state, setState] = useState<TaskState>(task.state);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep form in sync if task prop changes externally
    useEffect(() => {
        setTitle(task.title);
        setDueDate(task.dueDate);
        setAssignee(task.assignee ?? '');
        setPriority(task.priority);
        setState(task.state);
    }, [task.id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!dueDate) { setError('Due date is required'); return; }

        const payload = {
            title: title.trim(),
            dueDate,
            assignee: assignee.trim() || null,
            priority,
            state,
        };
        const parsed = UpdateTaskSchema.safeParse(payload);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? 'Invalid form data');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const updated = await tasksApi.update(task.id, parsed.data);
            onSaved(updated);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Edit Task</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Prospect (read-only) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Prospect</label>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                            {task.prospect.name}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="task-title" className="block text-xs font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Task title"
                        />
                    </div>

                    {/* Due date */}
                    <div>
                        <label htmlFor="task-due" className="block text-xs font-medium text-gray-700 mb-1">
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="task-due"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Priority + State row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="task-priority" className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                id="task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {PRIORITY_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-state" className="block text-xs font-medium text-gray-700 mb-1">State</label>
                            <select
                                id="task-state"
                                value={state}
                                onChange={(e) => setState(e.target.value as TaskState)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {STATE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label htmlFor="task-assignee" className="block text-xs font-medium text-gray-700 mb-1">
                            Assignee <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="task-assignee"
                            type="text"
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Agent name"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
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
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
