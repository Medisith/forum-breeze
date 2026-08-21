export function HomeFooter() {
    return (
        <footer className="border-border border-t">
            <div className="text-muted-foreground mx-auto flex max-w-6xl items-center justify-center px-4 py-6 text-xs">
                <span>FS © {new Date().getFullYear()} · Todos os direitos reservados</span>
            </div>
        </footer>
    );
}
