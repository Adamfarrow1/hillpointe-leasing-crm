import { Fragment } from 'react';
import type { ProspectStatus } from '../types';

interface StageConfig {
    status: ProspectStatus;
    label: string;
    accentColor: string;
}

const MAIN_FLOW: StageConfig[] = [
    { status: 'new', label: 'New', accentColor: '#6b7280' },
    { status: 'contacted', label: 'Contacted', accentColor: '#3b82f6' },
    { status: 'tour_scheduled', label: 'Tour Scheduled', accentColor: '#8b5cf6' },
    { status: 'toured', label: 'Toured', accentColor: '#f97316' },
    { status: 'application', label: 'Application', accentColor: '#eab308' },
    { status: 'leased', label: 'Leased', accentColor: '#22c55e' },
];

const LOST: StageConfig = {
    status: 'lost',
    label: 'Lost',
    accentColor: '#ef4444',
};

export interface PipelineFunnelProps {
    counts: Record<ProspectStatus, number>;
    onStageClick?: (status: ProspectStatus) => void;
}

interface StageCardProps {
    stage: StageConfig;
    count: number;
    onClick?: () => void;
    className?: string;
}

function ChevronRight() {
    return (
        <svg
            className="w-4 h-4 text-gray-300 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function StageCard({ stage, count, onClick, className = '' }: StageCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={`flex flex-col items-center gap-1 px-3 py-3 bg-white border border-gray-200 rounded-lg transition-all disabled:cursor-default ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300' : ''
                } ${className}`}
            style={{ borderTopWidth: '3px', borderTopColor: stage.accentColor }}
        >
            <span
                className="text-2xl font-bold leading-none tabular-nums"
                style={{ color: stage.accentColor }}
            >
                {count}
            </span>
            <span className="text-xs text-gray-500 font-medium text-center leading-tight">
                {stage.label}
            </span>
        </button>
    );
}

export function PipelineFunnel({ counts, onStageClick }: PipelineFunnelProps) {
    return (
        <div className="space-y-3">
            {/* Main pipeline flow */}
            <div className="flex items-stretch gap-1.5">
                {MAIN_FLOW.map((stage, idx) => (
                    <Fragment key={stage.status}>
                        <StageCard
                            stage={stage}
                            count={counts[stage.status]}
                            onClick={onStageClick ? () => onStageClick(stage.status) : undefined}
                            className="flex-1 min-w-0"
                        />
                        {idx < MAIN_FLOW.length - 1 && (
                            <div className="flex items-center shrink-0">
                                <ChevronRight />
                            </div>
                        )}
                    </Fragment>
                ))}
            </div>

            {/* Lost off-ramp */}
            <div className="flex flex-col items-center gap-1 pt-3 border-t border-dashed border-gray-200">

                <StageCard
                    stage={LOST}
                    count={counts.lost}
                    onClick={onStageClick ? () => onStageClick('lost') : undefined}
                    className="w-66"
                />
            </div>
        </div>
    );
}
