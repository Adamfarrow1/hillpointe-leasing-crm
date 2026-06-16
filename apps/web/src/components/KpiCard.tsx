import { useCountUp } from '../lib/useCountUp';

type AccentColor = 'blue' | 'green' | 'amber' | 'purple';

const dotClasses: Record<AccentColor, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-400',
    purple: 'bg-purple-500',
};

interface KpiCardProps {
    label: string;
    value: number;
    description?: string;
    accent?: AccentColor;
}

export function KpiCard({ label, value, description, accent = 'blue' }: KpiCardProps) {
    const animated = useCountUp(value);
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotClasses[accent]}`} />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-gray-900">{animated}</p>
            {description !== undefined && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
}
