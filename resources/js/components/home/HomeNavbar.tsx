import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Leaf, LogOut, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login, logout, register } from '@/routes';

type AuthUser = {
    name: string;
} | null;

function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
        >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
    );
}

function AuthActions() {
    const page = usePage<{ auth: { user: AuthUser } }>();
    const user = page.props.auth?.user;

    if (!user) {
        return (
            <>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={login()}>Login</Link>
                </Button>
                <Button size="sm" asChild>
                    <Link href={register()}>Register</Link>
                </Button>
            </>
        );
    }

    return (
        <>
            <span className="text-muted-foreground hidden max-w-32 truncate text-sm sm:inline" title={user.name}>
                {user.name}
            </span>
            <Button variant="ghost" size="sm" asChild>
                <Link href={dashboard()} aria-label="Dashboard">
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href={logout()} as="button" aria-label="Log out">
                    <LogOut className="size-4" aria-hidden="true" />
                </Link>
            </Button>
        </>
    );
}

export function HomeNavbar({ children }: { children?: ReactNode }) {
    return (
        <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
                <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Home">
                    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                        <Leaf className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-foreground text-base font-semibold tracking-tight">FS</span>
                </Link>

                <div className="hidden flex-1 justify-center sm:flex">{children}</div>

                <nav className="ml-auto flex shrink-0 items-center gap-2" aria-label="User menu">
                    <ThemeToggle />
                    <AuthActions />
                </nav>
            </div>
            {children ? <div className="px-4 pb-3 sm:hidden">{children}</div> : null}
        </header>
    );
}
