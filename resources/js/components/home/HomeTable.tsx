import { Link } from '@inertiajs/react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type HomeTableRow = {
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
};

function Avatar({ name, symbol }: { name: string; symbol: string }) {
    const letter = (symbol || name).slice(0, 1).toUpperCase();

    return (
        <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {letter}
        </span>
    );
}

export function HomeTable({ rows }: { rows: HomeTableRow[] }) {
    if (rows.length === 0) {
        return (
            <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm">
                Nenhuma notícia brasileira disponível nesta seção no momento.
            </p>
        );
    }

    return (
        <div className="border-border overflow-hidden rounded-xl border">
            <Table aria-label="Notícias brasileiras">
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead scope="col" className="w-12 pl-4">
                            #
                        </TableHead>
                        <TableHead scope="col">Notícia</TableHead>
                        <TableHead scope="col" className="text-right">
                            Resumo
                        </TableHead>
                        <TableHead scope="col" className="hidden text-right md:table-cell">
                            Fonte
                        </TableHead>
                        <TableHead scope="col" className="hidden text-right md:table-cell">
                            Data
                        </TableHead>
                        <TableHead scope="col" className="hidden pr-4 text-right lg:table-cell">
                            Hora
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="text-muted-foreground pl-4 tabular-nums">
                                {row.rank}
                            </TableCell>
                            <TableCell>
                                <Link href={row.href} className="flex items-center gap-2.5 hover:opacity-90">
                                    <Avatar name={row.name} symbol={row.symbol} />
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{row.name}</p>
                                        <p className="text-muted-foreground text-xs uppercase">
                                            {row.symbol}
                                        </p>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell className="max-w-[10rem] truncate text-right text-sm">
                                {row.price_label}
                            </TableCell>
                            <TableCell className="hidden max-w-[12rem] truncate text-right text-sm md:table-cell">
                                {row.metric_a}
                            </TableCell>
                            <TableCell className="hidden text-right tabular-nums md:table-cell">
                                {row.metric_b}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden pr-4 text-right tabular-nums lg:table-cell">
                                {row.updated_at}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
