import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

export type InternationalArticle = {
    id: string;
    title: string;
    url: string;
    source: string;
    published_at?: string | null;
    summary?: string | null;
    image_url?: string | null;
    path?: string;
};

function formatDateTime(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export function HomeNewsPanel({
    articles,
    className,
}: {
    articles: InternationalArticle[];
    className?: string;
}) {
    return (
        <section className={cn('flex flex-col gap-4', className)} aria-label="International News">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">International News</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Global environment headlines (The Guardian).
                </p>
            </div>

            {articles.length === 0 ? (
                <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm">
                    Nenhuma notícia internacional no momento. Configure{' '}
                    <code className="text-xs">GUARDIAN_API_KEY</code> no{' '}
                    <code className="text-xs">.env</code>.
                </p>
            ) : (
                <div className="max-h-[36rem] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                    <ul className="flex flex-col gap-3">
                        {articles.map((article) => {
                            const href = article.path ?? `/news/${article.id}`;

                            return (
                                <li key={article.id}>
                                    <Link
                                        href={href}
                                        className="border-border bg-card hover:bg-accent/40 flex h-full gap-3 overflow-hidden rounded-xl border p-3 transition-colors"
                                    >
                                        {article.image_url ? (
                                            <img
                                                src={article.image_url}
                                                alt=""
                                                className="size-16 shrink-0 rounded-md object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-md text-[10px] font-medium tracking-wide uppercase">
                                                intl
                                            </span>
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                                                <span className="truncate">{article.source}</span>
                                                {article.published_at ? (
                                                    <time
                                                        dateTime={article.published_at}
                                                        className="shrink-0 tabular-nums"
                                                    >
                                                        {formatDateTime(article.published_at)}
                                                    </time>
                                                ) : null}
                                            </div>
                                            <h3 className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
                                                {article.title}
                                            </h3>
                                            <span className="text-primary mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium">
                                                Ler no fórum
                                                <ExternalLink className="size-3" aria-hidden="true" />
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
