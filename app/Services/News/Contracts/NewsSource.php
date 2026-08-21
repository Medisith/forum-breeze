<?php

namespace App\Services\News\Contracts;

interface NewsSource
{
    /** Identificador estável da fonte (ex.: agencia-brasil-meio-ambiente). */
    public function key(): string;

    /**
     * @return list<array{
     *     id: string,
     *     title: string,
     *     url: string,
     *     source: string,
     *     summary: ?string,
     *     image_url: ?string,
     *     published_at: ?string,
     *     origin: string
     * }>
     */
    public function fetch(int $limit = 10): array;
}
