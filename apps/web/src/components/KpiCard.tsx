type AccentColor = 'blue' | 'green' | 'amber' | 'purple';

const accentClasses: Record<AccentColor, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
};

interface KpiCardProps {
    label: string;
    value: number;
    description?: string;
    accent?: AccentColor;
}

export function KpiCard({ label, value, description, accent = 'blue' }: KpiCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${accentClasses[accent]}`}>{value}</p>
            {description !== undefined && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
}
