import { Head, router, usePage } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { store } from '@/routes/register';

const schema = z
    .object({
        name: z.string().min(1, 'Informe o nome'),
        email: z.string().email('Informe um e-mail válido'),
        password: z.string().min(8, 'Mínimo de 8 caracteres'),
        password_confirmation: z.string().min(1, 'Confirme a senha'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'As senhas não coincidem',
        path: ['password_confirmation'],
    });

type FormData = z.infer<typeof schema>;

type Props = {
    passwordRules: string;
};

export default function RegisterPage({ passwordRules }: Props) {
    const pageErrors = usePage().props.errors as Record<string, string>;
    const [processing, setProcessing] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(store.url(), data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Cadastrar" />
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
                noValidate
            >
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        {...register('name')}
                    />
                    <InputError
                        message={errors.name?.message || pageErrors.name}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                    />
                    <InputError
                        message={errors.email?.message || pageErrors.email}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        passwordrules={passwordRules}
                        {...register('password')}
                    />
                    <InputError
                        message={
                            errors.password?.message || pageErrors.password
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">
                        Confirmar senha
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        passwordrules={passwordRules}
                        {...register('password_confirmation')}
                    />
                    <InputError
                        message={
                            errors.password_confirmation?.message ||
                            pageErrors.password_confirmation
                        }
                    />
                </div>
                <Button
                    type="submit"
                    disabled={processing}
                    data-test="register-user-button"
                >
                    Criar conta
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    Já tem conta? <TextLink href={login()}>Entrar</TextLink>
                </p>
            </form>
        </>
    );
}

RegisterPage.layout = {
    title: 'Criar uma conta',
    description: 'Informe seus dados para se cadastrar',
};
