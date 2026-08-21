import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index as forumIndex } from '@/routes/forum';
import { home, login } from '@/routes';
import { store as storePost } from '@/routes/forum/posts';
import { vote } from '@/routes/forum/topics';
import type { Auth } from '@/types';

type User = {
    id: number;
    name: string;
};

type Category = {
    id: number;
    name: string;
    slug: string;
};

type Post = {
    id: number;
    body: string;
    created_at: string;
    user: User | null;
};

type Topic = {
    id: number;
    title: string;
    body: string;
    type: string;
    votes_count: number;
    created_at: string;
    user: User | null;
    category: Category | null;
    posts: Post[];
};

type Props = {
    topic: Topic;
    userHasVoted: boolean;
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

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function ShowPage({ topic, userHasVoted }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [voting, setVoting] = useState(false);

    const toggleVote = () => {
        setVoting(true);
        router.post(
            vote.url(topic.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setVoting(false),
            },
        );
    };

    return (
        <>
            <Head title={topic.title} />
            <div className="mx-auto max-w-3xl p-4">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                    <Link
                        href={home()}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                        Início
                    </Link>
                    <span className="text-muted-foreground/50" aria-hidden="true">
                        /
                    </span>
                    <Link
                        href={forumIndex()}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Voltar ao fórum
                    </Link>
                </div>

                <article className="rounded-lg border p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold">{topic.title}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {topic.category && (
                                    <span>{topic.category.name}</span>
                                )}
                                <Badge variant="secondary">
                                    {topicTypeLabel(topic.type)}
                                </Badge>
                                {topic.user && <span>por {topic.user.name}</span>}
                                <span>{formatDate(topic.created_at)}</span>
                            </div>
                        </div>
                        {auth.user && (
                            <Button
                                type="button"
                                variant={userHasVoted ? 'default' : 'outline'}
                                size="sm"
                                disabled={voting}
                                onClick={toggleVote}
                            >
                                <ThumbsUp />
                                {userHasVoted ? 'Votado' : 'Votar'} (
                                {topic.votes_count})
                            </Button>
                        )}
                        {!auth.user && (
                            <span className="text-sm text-muted-foreground">
                                {topic.votes_count}{' '}
                                {topic.votes_count === 1 ? 'voto' : 'votos'}
                            </span>
                        )}
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {topic.body}
                    </div>
                </article>

                <section className="mt-8 space-y-4">
                    <h2 className="text-lg font-semibold">
                        Respostas ({topic.posts.length})
                    </h2>

                    {topic.posts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhuma resposta ainda. Seja o primeiro a comentar.
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {topic.posts.map((post) => (
                                <li
                                    key={post.id}
                                    className="rounded-lg border p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                                        <span>
                                            {post.user?.name ?? 'Usuário'}
                                        </span>
                                        <span>{formatDate(post.created_at)}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm">
                                        {post.body}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}

                    {auth.user ? (
                        <Form
                            {...storePost.form(topic.id)}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            className="space-y-4 rounded-lg border p-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="body">
                                            Sua resposta
                                        </Label>
                                        <textarea
                                            id="body"
                                            name="body"
                                            rows={4}
                                            required
                                            className={cn(
                                                'border-input placeholder:text-muted-foreground flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                            )}
                                            placeholder="Escreva sua resposta…"
                                        />
                                        <InputError message={errors.body} />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        Enviar resposta
                                    </Button>
                                </>
                            )}
                        </Form>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            <Link
                                href={login()}
                                className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                                Entre
                            </Link>{' '}
                            para responder a este tópico.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

ShowPage.layout = {
    breadcrumbs: [
        {
            title: 'Início',
            href: home(),
        },
        {
            title: 'Fórum',
            href: forumIndex(),
        },
    ],
};
