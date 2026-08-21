import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHighlights } from '@/components/home/HomeHighlights';
import { HomeNavbar } from '@/components/home/HomeNavbar';
import { HomeNewsPanel } from '@/components/home/HomeNewsPanel';
import { HomeStatsBar } from '@/components/home/HomeStatsBar';
import { HomeTable } from '@/components/home/HomeTable';
import { HomeTabs, type HomeTab } from '@/components/home/HomeTabs';
import { Button } from '@/components/ui/button';
import { index as forumIndex } from '@/routes/forum';

type FeedPayload = {
    international: Array<{
        id: string;
        title: string;
        url: string;
        source: string;
        published_at?: string | null;
        summary?: string | null;
        image_url?: string | null;
    }>;
    brazil: {
        stats: {
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
        tracked: {
            primary_value: string;
            primary_label: string;
            primary_hint: string;
            secondary_value: string;
            secondary_label: string;
            secondary_hint: string;
        };
        trending: Array<{
            id: string;
            name: string;
            symbol: string;
            value_label: string;
            change_pct: number;
            url?: string;
        }>;
        highlights: Array<{
            id: string;
            name: string;
            symbol: string;
            value_label: string;
            change_pct: number;
            url?: string;
        }>;
        table_environment: Array<{
            id: number;
            rank: number;
            name: string;
            symbol: string;
            price_label: string;
            change_24h_pct: number;
            metric_a: string;
            metric_b: string;
            updated_at: string;
            href: string;
        }>;
        table_social: Array<{
            id: number;
            rank: number;
            name: string;
            symbol: string;
            price_label: string;
            change_24h_pct: number;
            metric_a: string;
            metric_b: string;
            updated_at: string;
            href: string;
        }>;
    };
    sources_ok?: string[];
    sources_failed?: Array<{ key: string; error: string }>;
    cached?: boolean;
    fetched_at?: string;
};

type Props = {
    feed?: FeedPayload;
};

/**
 * Home: seções brasileiras (RSS Agência Brasil) + painel International News (Guardian).
 */
export default function Welcome({ feed }: Props) {
    const [tab, setTab] = useState<HomeTab>('environment');

    const brazil = feed?.brazil;
    const international = feed?.international ?? [];

    const rows = useMemo(() => {
        if (!brazil) {
            return [];
        }

        return tab === 'environment' ? brazil.table_environment : brazil.table_social;
    }, [brazil, tab]);

    const updatedLabel = feed?.fetched_at
        ? new Date(feed.fetched_at).toLocaleTimeString('pt-BR')
        : null;

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col font-sans antialiased">
            <Head title="Fórum Sustentável" />

            <HomeNavbar />
            <HomeStatsBar stats={brazil?.stats ?? null} />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
                <div className="mb-8">
                    <HomeHighlights
                        tracked={brazil?.tracked ?? null}
                        trending={brazil?.trending ?? []}
                        gainers={brazil?.highlights ?? []}
                    />
                </div>

                <div className="flex flex-col gap-10">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <section
                            className="flex flex-col gap-4 lg:col-span-2"
                            aria-label={
                                tab === 'environment'
                                    ? 'Notícias brasileiras de meio ambiente'
                                    : 'Notícias brasileiras de desenvolvimento social'
                            }
                        >
                            <div className="flex flex-col gap-3">
                                <HomeTabs active={tab} onChange={setTab} />

                                <div className="flex flex-wrap items-end justify-between gap-2">
                                    <div>
                                        <h1 className="text-2xl font-semibold tracking-tight">
                                            {tab === 'environment'
                                                ? 'Notícias — Meio ambiente'
                                                : 'Notícias — Desenvolvimento social'}
                                        </h1>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {tab === 'environment'
                                                ? 'RSS Agência Brasil (meio ambiente), com apoio das últimas.'
                                                : 'RSS Agência Brasil (direitos humanos / social).'}
                                        </p>
                                    </div>
                                    {updatedLabel ? (
                                        <p className="text-muted-foreground text-xs tabular-nums">
                                            atualizado {updatedLabel}
                                            {feed?.cached ? ' · cache' : ''}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <HomeTable rows={rows} />

                            <div className="flex justify-end">
                                <Button asChild variant="outline">
                                    <Link href={forumIndex()}>
                                        Ir ao fórum
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        <HomeNewsPanel
                            articles={international}
                            className="lg:sticky lg:top-4 lg:self-start"
                        />
                    </div>
                </div>
            </main>

            <HomeFooter />
        </div>
    );
}
