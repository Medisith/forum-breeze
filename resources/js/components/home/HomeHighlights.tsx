import { Link } from '@inertiajs/react';
import { Flame, Rocket } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type HomeHighlightItem = {
    id: string;
    name: string;
    symbol: string;
    value_label: string;
    change_pct: number;
    url?: string;
};

export type HomeTracked = {
    primary_value: string;
    primary_label: string;
    primary_hint: string;
    secondary_value: string;
    secondary_label: string;
    secondary_hint: string;
};

function Avatar({ name, symbol }: { name: string; symbol: string }) {
    const letter = (symbol || name).slice(0, 1).toUpperCase();

    return (
        <span
            className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            aria-hidden="true"
        >
            {letter}
        </span>
    );
}

export function HomeHighlights({
    tracked,
    trending,
    gainers,
    trendingTitle = 'Meio ambiente',
    gainersTitle = 'Desenvolvimento social',
}: {
    tracked: HomeTracked | null;
    trending: HomeHighlightItem[];
    gainers: HomeHighlightItem[];
    trendingTitle?: string;
    gainersTitle?: string;
}) {
    return (
        <div className="grid gap-4 lg:grid-cols-3" aria-label="Destaques Brasil">
            <div className="flex flex-col gap-3">
                <MetricCard
                    label={tracked?.primary_label ?? ''}
                    value={tracked?.primary_value ?? '—'}
                    hint={tracked?.primary_hint}
                />
                <MetricCard
                    label={tracked?.secondary_label ?? ''}
                    value={tracked?.secondary_value ?? '—'}
                    hint={tracked?.secondary_hint}
                />
            </div>

            <HighlightList
                title={trendingTitle}
                icon={<Flame className="size-4 text-orange-500" aria-hidden="true" />}
                items={trending}
                empty="Sem itens do RSS de meio ambiente."
            />

            <HighlightList
                title={gainersTitle}
                icon={<Rocket className="size-4 text-emerald-500" aria-hidden="true" />}
                items={gainers}
                empty="Sem itens do RSS de direitos humanos."
            />
        </div>
    );
}

function MetricCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="border-border flex flex-1 flex-col justify-center rounded-xl border px-4 py-3">
            <p className="text-foreground text-lg font-semibold tracking-tight tabular-nums">{value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
            {hint ? <p className="text-muted-foreground/80 mt-1 text-[11px]">{hint}</p> : null}
        </div>
    );
}

function HighlightList({
    title,
    icon,
    items,
    empty,
}: {
    title: string;
    icon: ReactNode;
    items: HomeHighlightItem[];
    empty: string;
}) {
    return (
        <div className="border-border rounded-xl border px-4 py-3">
            <div className="mb-3 flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            </div>
            {items.length === 0 ? (
                <p className="text-muted-foreground text-xs">{empty}</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {items.map((item) => {
                        const inner = (
                            <>
                                <Avatar name={item.name} symbol={item.symbol} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium" title={item.name}>
                                        {item.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs uppercase">{item.symbol}</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-0.5">
                                    <span className="text-sm tabular-nums">{item.value_label}</span>
                                </div>
                            </>
                        );

                        return (
                            <li key={item.id}>
                                {item.url ? (
                                    <Link
                                        href={item.url}
                                        className={cn('flex items-center gap-2.5 hover:opacity-90')}
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2.5">{inner}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
