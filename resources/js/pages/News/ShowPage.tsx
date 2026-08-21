import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeNavbar } from '@/components/home/HomeNavbar';
import { Button } from '@/components/ui/button';

type Article = {
    id: string;
    title: string;
    url: string;
    source: string;
    summary?: string | null;
    image_url?: string | null;
    published_at?: string | null;
    origin?: string;
};

type Props = {
    article: Article;
};

function formatDate(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/**
 * Leitura interna da notícia (conteúdo vindo do RSS/API em cache).
 * O texto completo da matéria original nem sempre vem no feed —
 * mostramos título + resumo e link opcional para a fonte.
 */
export default function ShowPage({ article }: Props) {
    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col font-sans antialiased">
            <Head title={article.title} />
            <HomeNavbar />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
                <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
                    <Link href="/">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Voltar à home
                    </Link>
                </Button>

                <article className="flex flex-col gap-5">
                    <header className="flex flex-col gap-2">
                        <p className="text-muted-foreground text-sm">{article.source}</p>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance">
                            {article.title}
                        </h1>
                        {article.published_at ? (
                            <time
                                dateTime={article.published_at}
                                className="text-muted-foreground text-sm tabular-nums"
                            >
                                {formatDate(article.published_at)}
                            </time>
                        ) : null}
                    </header>

                    {article.image_url ? (
                        <img
                            src={article.image_url}
                            alt=""
                            className="border-border max-h-80 w-full rounded-xl border object-cover"
                            loading="lazy"
                        />
                    ) : null}

                    {article.summary ? (
                        <div className="text-foreground/90 space-y-4 text-base leading-relaxed whitespace-pre-wrap">
                            {article.summary}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Esta fonte não enviou resumo no feed. Use o link da matéria original
                            abaixo.
                        </p>
                    )}

                    <div className="border-border flex flex-wrap items-center gap-3 border-t pt-6">
                        <Button asChild>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                                Abrir na fonte original
                                <ExternalLink className="size-4" aria-hidden="true" />
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/">Voltar</Link>
                        </Button>
                    </div>
                </article>
            </main>

            <HomeFooter />
        </div>
    );
}
