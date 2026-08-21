import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index as forumIndex } from '@/routes/forum';
import { create, show } from '@/routes/forum/topics';
import type { Auth } from '@/types';

type Category = {
    id: number;
    name: string;
    slug: string;
};

type Topic = {
    id: number;
    title: string;
    type: string;
    votes_count: number;
    category: Category | null;
};

type PaginatedTopics = {
    data: Topic[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

type Props = {
    topics: PaginatedTopics;
    categories: Category[];
    filters: { category?: string | null };
};

const topicTypeLabels: Record<string, string> = {
    discussao: 'Discussão',
    sugestao: 'Sugestão',
    proposta: 'Proposta',
    material: 'Material',
};

function topicTypeLabel(type: string): string {
    return topicTypeLabels[type] ?? type;
}

export default function IndexPage({ topics, categories, filters }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const activeCategory = filters.category ?? null;

    return (
        <>
            <Head title="Fórum" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Fórum Sustentável</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Discussões sobre meio ambiente e sustentabilidade.
                        </p>
                    </div>
                    {auth.user && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus />
                                Novo tópico
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={forumIndex()}
                        className={`rounded-md px-3 py-1 text-sm transition-colors ${
                            !activeCategory
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        Todas
                    </Link>
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={forumIndex({ query: { category: category.slug } })}
                            className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                activeCategory === category.slug
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>

                {topics.data.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        Nenhum tópico encontrado
                        {activeCategory ? ' nesta categoria' : ''}.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {topics.data.map((topic) => (
                            <li key={topic.id}>
                                <Link
                                    href={show(topic.id)}
                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/50"
                                >
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="truncate font-medium">
                                            {topic.title}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            {topic.category && (
                                                <span>{topic.category.name}</span>
                                            )}
                                            <Badge variant="secondary">
                                                {topicTypeLabel(topic.type)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-sm text-muted-foreground">
                                        {topic.votes_count}{' '}
                                        {topic.votes_count === 1 ? 'voto' : 'votos'}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {topics.links.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1">
                        {topics.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`rounded-md px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm text-muted-foreground/50"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ),
                        )}
                    </nav>
                )}
            </div>
        </>
    );
}

IndexPage.layout = {
    breadcrumbs: [
        {
            title: 'Fórum',
            href: forumIndex(),
        },
    ],
};
