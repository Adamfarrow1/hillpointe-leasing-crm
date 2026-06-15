import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 600): number {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number | null>(null);
    // Track the value we're animating FROM so mid-flight retriggers start smoothly
    const fromRef = useRef(0);

    useEffect(() => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

        const from = fromRef.current;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo: rockets off the line, glides to a stop — feels polished
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.round(from + (target - from) * eased);
            setCount(current);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = target;
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return count;
}
