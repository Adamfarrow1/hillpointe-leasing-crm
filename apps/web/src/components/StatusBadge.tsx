import type { ProspectStatus, UnitStatus, TaskPriority } from '@crm/contracts';

type BadgeVariant = ProspectStatus | UnitStatus | TaskPriority;

const variantClasses: Record<BadgeVariant, string> = {
    // ProspectStatus
    new: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    tour_scheduled: 'bg-amber-100 text-amber-700',
    toured: 'bg-purple-100 text-purple-700',
    application: 'bg-orange-100 text-orange-700',
    leased: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    // UnitStatus (available + held)
    available: 'bg-green-100 text-green-700',
    held: 'bg-amber-100 text-amber-700',
    // TaskPriority
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
};

const variantLabels: Record<BadgeVariant, string> = {
    new: 'New',
    contacted: 'Contacted',
    tour_scheduled: 'Tour Scheduled',
    toured: 'Toured',
    application: 'Application',
    leased: 'Leased',
    lost: 'Lost',
    available: 'Available',
    held: 'Held',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

interface StatusBadgeProps {
    variant: BadgeVariant;
}

export function StatusBadge({ variant }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]}`}
        >
            {variantLabels[variant]}
        </span>
    );
}
