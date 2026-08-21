import { ArrowDown, ArrowUp } from 'lucide-react';

import { cn } from '@/lib/utils';

export type HomeStats = {
    topics: number;
    members: number;
    engagement_label: string;
    engagement_value: string;
    engagement_change_pct: number;
    activity_24h: string;
    dominance_a_label: string;
    dominance_a_pct: number;
    dominance_b_label: string;
    dominance_b_pct: number;
};

function formatInteger(n: number): string {
    return new Intl.NumberFormat('pt-BR').format(n);
}

export function HomeStatsBar({
    stats,
    isLoading = false,
}: {
    stats: HomeStats | null;
    isLoading?: boolean;
}) {
    if (isLoading && !stats) {
        return (
            <div className="border-border bg-background/60 border-b" aria-busy="true">
                <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs">
                    <span className="bg-muted h-3 w-24 animate-pulse rounded" />
                    <span className="bg-muted h-3 w-28 animate-pulse rounded" />
                    <span className="bg-muted h-3 w-36 animate-pulse rounded" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const positive = stats.engagement_change_pct >= 0;

    return (
        <div className="border-border bg-background/60 border-b" aria-label="Estatísticas das fontes brasileiras">
            <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs tabular-nums">
                <Stat label="Meio ambiente" value={formatInteger(stats.topics)} />
                <Stat label="Social" value={formatInteger(stats.members)} />
                <span className="inline-flex items-center gap-1.5">
                    <span>{stats.engagement_label}:</span>
                    <span className="text-foreground font-medium">{stats.engagement_value}</span>
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 font-medium',
                            positive ? 'text-emerald-500' : 'text-red-500',
                        )}
                    >
                        {positive ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                        )}
                        {Math.abs(stats.engagement_change_pct).toFixed(1)}%
                    </span>
                </span>
                <Stat label="Últimas" value={stats.activity_24h} />
                <span className="inline-flex items-center gap-1.5">
                    <span>Mix:</span>
                    <span className="text-foreground font-medium">
                        {stats.dominance_a_label} {stats.dominance_a_pct.toFixed(1)}%
                    </span>
                    <span className="text-foreground font-medium">
                        {stats.dominance_b_label} {stats.dominance_b_pct.toFixed(1)}%
                    </span>
                </span>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span>{label}:</span>
            <span className="text-foreground font-medium">{value}</span>
        </span>
    );
}
