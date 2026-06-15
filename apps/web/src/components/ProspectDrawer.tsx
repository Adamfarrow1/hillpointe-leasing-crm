import { useState, useEffect } from 'react';
import type { Prospect, ProspectStatus, ActivityEventWithRelations } from '@crm/contracts';
import { prospectsApi } from '../lib/prospectsApi';
import type { StatusTransitionResult } from '../lib/prospectsApi';
import { activityApi } from '../lib/activityApi';
import { StatusBadge } from './StatusBadge';
import { ActivityTimeline } from './ActivityTimeline';

const PIPELINE_STAGES: ProspectStatus[] = [
    'new',
    'contacted',
    'tour_scheduled',
    'toured',
    'application',
    'leased',
];

const STAGE_LABELS: Record<ProspectStatus, string> = {
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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function CloseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a2 2 0 012-2h0a2 2 0 012 2v5" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

const ALL_STATUSES: { value: ProspectStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'tour_scheduled', label: 'Tour Scheduled' },
    { value: 'toured', label: 'Toured' },
    { value: 'application', label: 'Application' },
    { value: 'leased', label: 'Leased' },
    { value: 'lost', label: 'Lost' },
];

interface ProspectDrawerProps {
    prospect: Prospect;
    onClose: () => void;
    onEdit: (prospect: Prospect) => void;
    onProspectChange: (updated: Prospect) => void;
}

export function ProspectDrawer({ prospect, onClose, onEdit, onProspectChange }: ProspectDrawerProps) {
    const isLost = prospect.status === 'lost';
    const currentStageIndex = PIPELINE_STAGES.indexOf(prospect.status);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [automationResult, setAutomationResult] = useState<StatusTransitionResult | null>(null);
    const [activity, setActivity] = useState<ActivityEventWithRelations[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    useEffect(() => {
        setActivityLoading(true);
        activityApi
            .getProspectActivity(prospect.id)
            .then(setActivity)
            .catch(() => setActivity([]))
            .finally(() => setActivityLoading(false));
    }, [prospect.id]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col overflow-hidden animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Prospect Details</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Identity block */}
                    <div className="px-5 py-5 border-b border-gray-100">
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${getAvatarColor(prospect.id)}`}
                            >
                                {getInitials(prospect.name)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-semibold text-gray-900 leading-tight">{prospect.name}</p>
                                <div className="mt-1.5">
                                    <StatusBadge variant={prospect.status} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact info */}
                    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                            <MailIcon />
                            <a href={`mailto:${prospect.email}`} className="hover:text-blue-600 truncate">
                                {prospect.email}
                            </a>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                            <PhoneIcon />
                            <a href={`tel:${prospect.phone}`} className="hover:text-blue-600">
                                {prospect.phone}
                            </a>
                        </div>
                    </div>

                    {/* Unit & added date */}
                    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assignment</p>
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                            <BuildingIcon />
                            {prospect.assignedUnit
                                ? <span>{prospect.assignedUnit.unitNumber}</span>
                                : <span className="text-gray-400">No unit assigned</span>
                            }
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                            <CalendarIcon />
                            <span>Added {formatDate(prospect.createdAt)}</span>
                        </div>
                    </div>

                    {/* Pipeline progress */}
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Pipeline</p>

                        {isLost ? (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                Prospect marked as lost
                            </div>
                        ) : (
                            <ol className="space-y-2">
                                {PIPELINE_STAGES.map((stage, idx) => {
                                    const isDone = idx < currentStageIndex;
                                    const isCurrent = idx === currentStageIndex;
                                    const isFuture = idx > currentStageIndex;

                                    return (
                                        <li key={stage} className="flex items-center gap-3">
                                            {/* Node */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                                                ${isDone ? 'bg-blue-600 text-white' : ''}
                                                ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                                                ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                                            `}>
                                                {isDone ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                            {/* Label */}
                                            <span className={`text-sm ${isCurrent ? 'font-semibold text-gray-900' : isDone ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {STAGE_LABELS[stage]}
                                            </span>
                                            {isCurrent && (
                                                <span className="ml-auto text-xs text-blue-600 font-medium">Current</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    {/* Activity timeline */}
                    <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
                        <ActivityTimeline
                            events={activity}
                            loading={activityLoading}
                            compact
                            emptyMessage="No activity recorded for this prospect yet."
                        />
                    </div>
                </div>

                {/* Status picker (shown when Change Status is active) */}
                {showStatusPicker && (
                    <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Select new status</p>
                        {statusError && (
                            <p className="mb-2 text-xs text-red-600">{statusError}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_STATUSES.map((s) => (
                                <button
                                    key={s.value}
                                    disabled={s.value === prospect.status || changingStatus}
                                    onClick={async () => {
                                        // Capture previous state for rollback
                                        const previousProspect = { ...prospect };
                                        const newStatus = s.value;

                                        // Optimistic update — reflect new status in UI immediately
                                        onProspectChange({ ...prospect, status: newStatus });
                                        setShowStatusPicker(false);
                                        setChangingStatus(true);
                                        setStatusError(null);
                                        setAutomationResult(null);

                                        try {
                                            const result = await prospectsApi.changeStatus(prospect.id, newStatus);
                                            // Replace with server-confirmed record
                                            onProspectChange(result.prospect);
                                            setAutomationResult(result);
                                        } catch (err: unknown) {
                                            // Roll back to previous state
                                            onProspectChange(previousProspect);
                                            setShowStatusPicker(true);
                                            setStatusError(err instanceof Error ? err.message : 'Status change failed');
                                        } finally {
                                            setChangingStatus(false);
                                        }
                                    }}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50
                                        ${s.value === prospect.status
                                            ? 'bg-blue-100 text-blue-700 cursor-default ring-1 ring-blue-300'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                                        }`}
                                >
                                    {changingStatus ? '…' : s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Automation result banner */}
                {automationResult && (
                    <div className="px-5 py-3 border-t border-green-200 bg-green-50">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-green-700 mb-1">
                                    ✓ Status updated — automation ran
                                </p>
                                {automationResult.createdTasks.map((t) => (
                                    <p key={t.id} className="text-xs text-green-600 truncate">
                                        + Task: "{t.title}" (due {t.dueDate})
                                    </p>
                                ))}
                                {automationResult.closedTasksCount > 0 && (
                                    <p className="text-xs text-green-600">
                                        ✓ {automationResult.closedTasksCount} task(s) auto-closed
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setAutomationResult(null)}
                                className="text-green-500 hover:text-green-700 text-xs shrink-0"
                                aria-label="Dismiss"
                            >✕</button>
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div className="px-5 py-4 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={() => onEdit(prospect)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setShowStatusPicker((v) => !v)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showStatusPicker
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {showStatusPicker ? 'Cancel' : 'Change Status'}
                    </button>
                </div>
            </div>
        </>
    );
}
