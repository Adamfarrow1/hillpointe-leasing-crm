const EVENT_TYPE_LABELS: Record<string, string> = {
    status_changed: 'Status Changed',
    task_created: 'Task Created',
    task_completed: 'Task Completed',
    tour_scheduled: 'Tour Scheduled',
    tour_completed: 'Tour Completed',
    unit_leased: 'Unit Leased',
    unit_updated: 'Unit Updated',
};

export function formatEventType(type: string): string {
    return (
        EVENT_TYPE_LABELS[type] ??
        type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

export function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    const year = date.getFullYear() !== now.getFullYear() ? ('numeric' as const) : undefined;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year });
}
