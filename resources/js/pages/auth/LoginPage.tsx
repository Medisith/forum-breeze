import { Head, router, usePage } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';
import { register as registerRoute } from '@/routes';
import { request } from '@/routes/password';

const schema = z.object({
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(1, 'Informe a senha'),
    remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function LoginPage({ status, canResetPassword }: Props) {
    const pageErrors = usePage().props.errors as Record<string, string>;
    const [processing, setProcessing] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '', remember: false },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(store.url(), data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Entrar" />
            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
                noValidate
            >
                <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        {...register('email')}
                    />
                    <InputError
                        message={errors.email?.message || pageErrors.email}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Senha</Label>
                        {canResetPassword && (
                            <TextLink href={request()} className="ml-auto text-sm">
                                Esqueceu a senha?
                            </TextLink>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        {...register('password')}
                    />
                    <InputError
                        message={
                            errors.password?.message || pageErrors.password
                        }
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remember"
                        checked={watch('remember')}
                        onCheckedChange={(v) => setValue('remember', v === true)}
                    />
                    <Label htmlFor="remember">Lembrar de mim</Label>
                </div>
                <Button type="submit" disabled={processing} data-test="login-button">
                    Entrar
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    Não tem conta?{' '}
                    <TextLink href={registerRoute()}>Cadastre-se</TextLink>
                </p>
            </form>
        </>
    );
}

LoginPage.layout = {
    title: 'Entrar na sua conta',
    description: 'Informe seu e-mail e senha para entrar',
};
