import { useState, useEffect, useMemo } from 'react';
import type { TaskWithProspect } from '@crm/contracts';
import { tasksApi } from '../lib/tasksApi';
import { StatusBadge } from '../components/StatusBadge';
import { TaskEditModal } from '../components/TaskEditModal';
import { useCountUp } from '../lib/useCountUp';

// ─── date helpers ────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const IN_3_DAYS = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
})();

function isOverdue(task: TaskWithProspect) {
    return task.state === 'open' && task.dueDate < TODAY;
}
function isDueToday(task: TaskWithProspect) {
    return task.state === 'open' && task.dueDate === TODAY;
}
function isDueSoon(task: TaskWithProspect) {
    return task.state === 'open' && task.dueDate > TODAY && task.dueDate <= IN_3_DAYS;
}

function formatDue(dateStr: string): string {
    if (dateStr === TODAY) return 'Today';
    const date = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((date.getTime() - new Date(TODAY + 'T00:00:00').getTime()) / 86_400_000);
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── icons ───────────────────────────────────────────────────────────────────

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

// ─── summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
    const animated = useCountUp(value);
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${accent}`} />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-3xl font-bold mt-1 tabular-nums text-gray-900">{animated}</p>
        </div>
    );
}

function TaskCard({
    task,
    completing,
    deleting,
    onComplete,
    onReopen,
    onEdit,
    onDelete,
}: {
    task: TaskWithProspect;
    completing: boolean;
    deleting: boolean;
    onComplete: () => void;
    onReopen: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const overdue = isOverdue(task);
    const today = isDueToday(task);
    const done = task.state === 'done';

    return (
        <div className={`flex items-start gap-4 px-4 py-3.5 rounded-lg border transition-colors ${done ? 'bg-gray-50 border-gray-100' :
            overdue ? 'bg-red-50 border-red-100' :
                today ? 'bg-amber-50 border-amber-100' :
                    'bg-white border-gray-200'
            }`}>
            {/* Complete / reopen button */}
            <button
                onClick={done ? onReopen : onComplete}
                disabled={completing || deleting}
                aria-label={done ? 'Reopen task' : 'Mark complete'}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 ${done
                    ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                    : overdue
                        ? 'border-red-400 text-transparent hover:bg-red-100 hover:text-red-500'
                        : 'border-gray-300 text-transparent hover:bg-blue-50 hover:border-blue-400 hover:text-blue-500'
                    }`}
            >
                {completing
                    ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <CheckIcon />
                }
            </button>

            {/* Body */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.prospect.name && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <UserIcon />
                            {task.prospect.name}
                        </span>
                    )}
                    {task.assignee && (
                        <span className="text-xs text-gray-400">→ {task.assignee}</span>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
                <StatusBadge variant={task.priority} />
                <span className={`text-xs font-medium ${done ? 'text-gray-400' :
                    overdue ? 'text-red-600' :
                        today ? 'text-amber-600' :
                            'text-gray-500'
                    }`}>
                    {formatDue(task.dueDate)}
                </span>

                {/* Edit */}
                <button
                    onClick={onEdit}
                    disabled={deleting}
                    aria-label="Edit task"
                    className="ml-1 p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                >
                    <PencilIcon />
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    disabled={deleting}
                    aria-label="Delete task"
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                    {deleting
                        ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                        : <TrashIcon />
                    }
                </button>
            </div>
        </div>
    );
}

// ─── section ─────────────────────────────────────────────────────────────────

function Section({
    title,
    tasks,
    completing,
    deleting,
    onComplete,
    onReopen,
    onEdit,
    onDelete,
    emptyLabel,
}: {
    title: string;
    tasks: TaskWithProspect[];
    completing: Set<string>;
    deleting: Set<string>;
    onComplete: (id: string) => void;
    onReopen: (id: string) => void;
    onEdit: (task: TaskWithProspect) => void;
    onDelete: (id: string) => void;
    emptyLabel?: string;
}) {
    if (tasks.length === 0 && !emptyLabel) return null;
    return (
        <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {title} <span className="text-gray-400 font-normal">({tasks.length})</span>
            </h3>
            {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">{emptyLabel}</p>
            ) : (
                <div className="space-y-2">
                    {tasks.map((t) => (
                        <TaskCard
                            key={t.id}
                            task={t}
                            completing={completing.has(t.id)}
                            deleting={deleting.has(t.id)}
                            onComplete={() => onComplete(t.id)}
                            onReopen={() => onReopen(t.id)}
                            onEdit={() => onEdit(t)}
                            onDelete={() => onDelete(t.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── filter tabs ─────────────────────────────────────────────────────────────

type Filter = 'all' | 'open' | 'done' | 'overdue';

function FilterTab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {label}
            <span className={`ml-1.5 text-xs ${active ? 'text-blue-400' : 'text-gray-400'}`}>{count}</span>
        </button>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function Tasks() {
    const [tasks, setTasks] = useState<TaskWithProspect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completing, setCompleting] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState<Set<string>>(new Set());
    const [editingTask, setEditingTask] = useState<TaskWithProspect | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    function load() {
        setLoading(true);
        setError(null);
        tasksApi.list()
            .then(setTasks)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load tasks'))
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    async function handleComplete(id: string) {
        // Optimistic update
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, state: 'done' } : t));
        setCompleting((s) => new Set(s).add(id));
        try {
            const updated = await tasksApi.complete(id);
            setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
        } catch {
            // Roll back
            setTasks((prev) => prev.map((t) => t.id === id ? { ...t, state: 'open' } : t));
        } finally {
            setCompleting((s) => { const next = new Set(s); next.delete(id); return next; });
        }
    }

    async function handleReopen(id: string) {
        // Optimistic update
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, state: 'open' } : t));
        setCompleting((s) => new Set(s).add(id));
        try {
            const updated = await tasksApi.reopen(id);
            setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
        } catch {
            // Roll back
            setTasks((prev) => prev.map((t) => t.id === id ? { ...t, state: 'done' } : t));
        } finally {
            setCompleting((s) => { const next = new Set(s); next.delete(id); return next; });
        }
    }

    function handleEditSaved(updated: TaskWithProspect) {
        setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
        setEditingTask(null);
    }

    async function handleDeleteConfirmed() {
        const id = confirmDeleteId;
        if (!id) return;
        setConfirmDeleteId(null);
        setDeleting((s) => new Set(s).add(id));
        try {
            await tasksApi.delete(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch {
            // task stays in list
        } finally {
            setDeleting((s) => { const next = new Set(s); next.delete(id); return next; });
        }
    }

    // ── derived counts ──
    const openTasks = useMemo(() => tasks.filter((t) => t.state === 'open'), [tasks]);
    const doneTasks = useMemo(() => tasks.filter((t) => t.state === 'done'), [tasks]);
    const overdueTasks = useMemo(() => tasks.filter(isOverdue), [tasks]);
    const dueTodayTasks = useMemo(() => tasks.filter(isDueToday), [tasks]);
    const dueSoonTasks = useMemo(() => tasks.filter(isDueSoon), [tasks]);
    const otherOpenTasks = useMemo(
        () => openTasks.filter((t) => !isOverdue(t) && !isDueToday(t) && !isDueSoon(t)),
        [openTasks],
    );

    // ── assignee options ──
    const assigneeOptions = useMemo(() => {
        const names = [...new Set(
            tasks.map((t) => t.assignee).filter((a): a is string => a != null && a.trim() !== ''),
        )].sort();
        return names;
    }, [tasks]);

    // ── assignee filter helper ──
    function applyAssignee(list: typeof tasks) {
        if (assigneeFilter === 'all') return list;
        if (assigneeFilter === 'unassigned') return list.filter((t) => !t.assignee);
        return list.filter((t) => t.assignee === assigneeFilter);
    }

    // ── filtered view ──
    const filterCounts: Record<Filter, number> = {
        all: tasks.length,
        open: openTasks.length,
        done: doneTasks.length,
        overdue: overdueTasks.length,
    };

    const overdueFiltered = applyAssignee(filter === 'done' ? [] : overdueTasks);
    const todayFiltered = applyAssignee(filter === 'done' || filter === 'overdue' ? [] : dueTodayTasks);
    const soonFiltered = applyAssignee(filter === 'done' || filter === 'overdue' ? [] : dueSoonTasks);
    const otherFiltered = applyAssignee(filter === 'done' || filter === 'overdue' ? [] : otherOpenTasks);
    const doneFiltered = applyAssignee(filter === 'open' || filter === 'overdue' ? [] : doneTasks);

    // Shared section props to avoid repetition
    const sectionProps = {
        completing,
        deleting,
        onComplete: handleComplete,
        onReopen: handleReopen,
        onEdit: setEditingTask,
        onDelete: setConfirmDeleteId,
    };

    return (
        <div className="space-y-6">
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
            `}</style>

            {/* Header */}
            <div className="animate-fade-up">
                <p className="text-sm text-gray-500 mt-0.5">
                    Follow-up tasks generated by prospect status automation
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 animate-fade-up delay-100">
                <SummaryCard label="Open Tasks" value={openTasks.length} accent="bg-blue-500" />
                <SummaryCard label="Due Today" value={dueTodayTasks.length} accent="bg-amber-400" />
                <SummaryCard label="Overdue" value={overdueTasks.length} accent="bg-red-500" />
                <SummaryCard label="Completed" value={doneTasks.length} accent="bg-green-500" />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={load} className="ml-4 font-medium underline hover:no-underline">Retry</button>
                </div>
            )}

            {/* Filter tabs + assignee dropdown */}
            <div className="space-y-3 animate-fade-up delay-200">
                <div className="flex items-center gap-0.5 border-b border-gray-200">
                    {(['all', 'open', 'done', 'overdue'] as Filter[]).map((f) => (
                        <FilterTab
                            key={f}
                            label={f.charAt(0).toUpperCase() + f.slice(1)}
                            active={filter === f}
                            onClick={() => setFilter(f)}
                            count={filterCounts[f]}
                        />
                    ))}
                </div>
                {assigneeOptions.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="assignee-filter" className="text-sm text-gray-500">Assignee</label>
                        <select
                            id="assignee-filter"
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="py-1.5 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                        >
                            <option value="all">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {assigneeOptions.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="animate-fade-up delay-300">
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start gap-4 px-4 py-3.5 rounded-lg border border-gray-200 bg-white animate-pulse">
                            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-2/5" />
                                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="h-5 w-12 bg-gray-100 rounded-full" />
                                <div className="h-3 w-10 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="py-20 text-center">
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        No tasks yet. Tasks will be created automatically as prospects move through the leasing pipeline.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {overdueFiltered.length > 0 && (
                        <Section title="Overdue" tasks={overdueFiltered} {...sectionProps} />
                    )}
                    {todayFiltered.length > 0 && (
                        <Section title="Due Today" tasks={todayFiltered} {...sectionProps} />
                    )}
                    {soonFiltered.length > 0 && (
                        <Section title="Due Soon" tasks={soonFiltered} {...sectionProps} />
                    )}
                    {otherFiltered.length > 0 && (
                        <Section title="Open" tasks={otherFiltered} {...sectionProps} />
                    )}
                    {doneFiltered.length > 0 && (
                        <Section title="Completed" tasks={doneFiltered} {...sectionProps} />
                    )}
                    {filter !== 'all' && overdueFiltered.length === 0 && todayFiltered.length === 0 &&
                        soonFiltered.length === 0 && otherFiltered.length === 0 && doneFiltered.length === 0 && (
                            <p className="text-sm text-gray-400 py-4 text-center">No tasks in this view.</p>
                        )}
                </div>
            )}
            </div>

            {/* Edit modal */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onSaved={handleEditSaved}
                    onClose={() => setEditingTask(null)}
                />
            )}

            {/* Delete confirm dialog */}
            {confirmDeleteId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Delete task?</h3>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleDeleteConfirmed()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
