import { Head, Link, router, usePage } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index as forumIndex } from '@/routes/forum';
import { create, show, store } from '@/routes/forum/topics';

type Category = {
    id: number;
    name: string;
    slug: string;
};

type TopicTypeOption = {
    value: string;
    label: string;
};

type Props = {
    categories: Category[];
    topicTypes: TopicTypeOption[];
};

const schema = z.object({
    title: z.string().min(1, 'Informe o título').max(255, 'Máximo de 255 caracteres'),
    body: z.string().min(1, 'Informe o conteúdo'),
    category_id: z.string().min(1, 'Selecione uma categoria'),
    type: z.string().min(1, 'Selecione o tipo'),
});

type FormData = z.infer<typeof schema>;

export default function CreateTopicPage({ categories, topicTypes }: Props) {
    const pageErrors = usePage().props.errors as Record<string, string>;
    const [processing, setProcessing] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            body: '',
            category_id: '',
            type: topicTypes[0]?.value ?? '',
        },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(
            store.url(),
            {
                ...data,
                category_id: Number(data.category_id),
            },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Novo tópico" />
            <div className="mx-auto max-w-2xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Novo tópico</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Compartilhe uma ideia, proposta ou material com a comunidade.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-6"
                    noValidate
                >
                    <div className="grid gap-2">
                        <Label htmlFor="category_id">Categoria</Label>
                        <select
                            id="category_id"
                            className={cn(
                                'border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            )}
                            {...register('category_id')}
                        >
                            <option value="">Selecione…</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={
                                errors.category_id?.message ||
                                pageErrors.category_id
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <select
                            id="type"
                            className={cn(
                                'border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            )}
                            {...register('type')}
                        >
                            {topicTypes.map((topicType) => (
                                <option
                                    key={topicType.value}
                                    value={topicType.value}
                                >
                                    {topicType.label}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={errors.type?.message || pageErrors.type}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            autoFocus
                            {...register('title')}
                        />
                        <InputError
                            message={errors.title?.message || pageErrors.title}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="body">Conteúdo</Label>
                        <textarea
                            id="body"
                            rows={8}
                            className={cn(
                                'border-input placeholder:text-muted-foreground flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            )}
                            {...register('body')}
                        />
                        <InputError
                            message={errors.body?.message || pageErrors.body}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" disabled={processing}>
                            Publicar tópico
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={forumIndex()}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateTopicPage.layout = {
    breadcrumbs: [
        {
            title: 'Início',
            href: home(),
        },
        {
            title: 'Fórum',
            href: forumIndex(),
        },
        {
            title: 'Novo tópico',
            href: create(),
        },
    ],
};
