import type { ActivityEventWithRelations } from '@crm/contracts';
import { formatEventType, formatTimestamp } from '../lib/activityFormatters';

// ─── badge ────────────────────────────────────────────────────────────────────

const BADGE_CLASSES: Record<string, string> = {
    status_changed: 'bg-blue-100 text-blue-700',
    task_created: 'bg-purple-100 text-purple-700',
    task_completed: 'bg-green-100 text-green-700',
    tour_scheduled: 'bg-amber-100 text-amber-700',
    tour_completed: 'bg-teal-100 text-teal-700',
    unit_leased: 'bg-indigo-100 text-indigo-700',
    unit_updated: 'bg-slate-100 text-slate-600',
};

export function ActivityEventBadge({ type }: { type: string }) {
    const cls = BADGE_CLASSES[type] ?? 'bg-gray-100 text-gray-600';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
            {formatEventType(type)}
        </span>
    );
}

// ─── icon ─────────────────────────────────────────────────────────────────────

const ICON_BG: Record<string, string> = {
    status_changed: 'bg-blue-100 text-blue-600',
    task_created: 'bg-purple-100 text-purple-600',
    task_completed: 'bg-green-100 text-green-600',
    tour_scheduled: 'bg-amber-100 text-amber-600',
    tour_completed: 'bg-teal-100 text-teal-600',
    unit_leased: 'bg-indigo-100 text-indigo-600',
    unit_updated: 'bg-slate-100 text-slate-500',
};

function ArrowRightSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
    );
}
function ClipboardPlusSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 11v4m-2-2h4" />
        </svg>
    );
}
function ClipboardCheckSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    );
}
function CalendarSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}
function HomeSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}
function BoltSvg() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

export function ActivityEventIcon({ type }: { type: string }) {
    const bg = ICON_BG[type] ?? 'bg-gray-100 text-gray-500';
    let inner: React.ReactNode;
    switch (type) {
        case 'status_changed': inner = <ArrowRightSvg />; break;
        case 'task_created': inner = <ClipboardPlusSvg />; break;
        case 'task_completed': inner = <ClipboardCheckSvg />; break;
        case 'tour_scheduled':
        case 'tour_completed': inner = <CalendarSvg />; break;
        case 'unit_leased':
        case 'unit_updated': inner = <HomeSvg />; break;
        default: inner = <BoltSvg />;
    }
    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            {inner}
        </div>
    );
}

// ─── timeline item ────────────────────────────────────────────────────────────

export function ActivityTimelineItem({
    event,
    compact = false,
    isLast = false,
}: {
    event: ActivityEventWithRelations;
    compact?: boolean;
    isLast?: boolean;
}) {
    return (
        <div className="flex gap-3">
            {/* Left: icon + connector */}
            <div className="flex flex-col items-center">
                <ActivityEventIcon type={event.type} />
                {!isLast && <div className="w-px flex-1 min-h-[1rem] bg-gray-100 mt-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${compact ? 'pb-3' : 'pb-4'}`}>
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-900 leading-snug`}>
                    {event.summary}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {!compact && <ActivityEventBadge type={event.type} />}
                    {event.prospect && (
                        <span className="text-xs text-gray-500">{event.prospect.name}</span>
                    )}
                    {event.unit && (
                        <span className="text-xs text-gray-400">Unit {event.unit.unitNumber}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                        {formatTimestamp(event.timestamp)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── timeline list ────────────────────────────────────────────────────────────

export function ActivityTimeline({
    events,
    loading,
    compact = false,
    emptyMessage = 'No activity recorded yet.',
}: {
    events: ActivityEventWithRelations[];
    loading: boolean;
    compact?: boolean;
    emptyMessage?: string;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (events.length === 0) {
        return (
            <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'} py-2`}>
                {emptyMessage}
            </p>
        );
    }
    return (
        <div>
            {events.map((event, idx) => (
                <ActivityTimelineItem
                    key={event.id}
                    event={event}
                    compact={compact}
                    isLast={idx === events.length - 1}
                />
            ))}
        </div>
    );
}
