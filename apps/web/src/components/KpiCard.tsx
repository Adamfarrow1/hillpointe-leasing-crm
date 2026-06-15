import { useEffect, useRef, useState } from 'react';

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

/** Animates a number from its previous value to the target value. */
function useCountUp(target: number, duration = 600) {
    const [display, setDisplay] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        // Honor reduced-motion preference.
        if (typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(target);
            fromRef.current = target;
            return;
        }

        const from = fromRef.current;
        if (from === target) return;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (target - from) * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = target;
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            fromRef.current = target;
        };
    }, [target, duration]);

    return display;
}

export function KpiCard({ label, value, description, accent = 'blue' }: KpiCardProps) {
    const display = useCountUp(value);

    return (
        <div className="card-hover bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${accentClasses[accent]}`}>{display}</p>
            {description !== undefined && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
}
