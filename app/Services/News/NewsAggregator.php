<?php

namespace App\Services\News;

use App\Services\News\Contracts\NewsSource;
use App\Services\News\Sources\GuardianEnvironmentSource;
use App\Services\News\Sources\RssFeedSource;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class NewsAggregator
{
    private const CACHE_KEY = 'home.news.v2';

    private const CATALOG_KEY = 'home.news.catalog.v2';

    private const CACHE_TTL_SECONDS = 2700; // 45 min

    /**
     * Payload tipado para a home Inertia.
     *
     * @return array{
     *     international: list<array<string, mixed>>,
     *     brazil: array{
     *         stats: array<string, mixed>,
     *         tracked: array<string, mixed>,
     *         trending: list<array<string, mixed>>,
     *         highlights: list<array<string, mixed>>,
     *         table_environment: list<array<string, mixed>>,
     *         table_social: list<array<string, mixed>>
     *     },
     *     sources_ok: list<string>,
     *     sources_failed: list<array{key: string, error: string}>,
     *     cached: bool,
     *     fetched_at: string
     * }
     */
    public function forHome(): array
    {
        try {
            $cached = Cache::get(self::CACHE_KEY);
            if (is_array($cached) && isset($cached['international'], $cached['brazil'])) {
                $cached['cached'] = true;

                return $cached;
            }
        } catch (Throwable $e) {
            Log::warning('Cache indisponível na home news', ['error' => $e->getMessage()]);
        }

        $fresh = $this->buildFresh();

        try {
            Cache::put(self::CACHE_KEY, $fresh, self::CACHE_TTL_SECONDS);
        } catch (Throwable $e) {
            Log::warning('Falha ao gravar cache de news', ['error' => $e->getMessage()]);
        }

        $fresh['cached'] = false;

        return $fresh;
    }

    /**
     * Localiza artigo pelo id (sha1) no catálogo em cache.
     *
     * @return array<string, mixed>|null
     */
    public function findById(string $id): ?array
    {
        try {
            $catalog = Cache::get(self::CATALOG_KEY);
            if (is_array($catalog) && isset($catalog[$id]) && is_array($catalog[$id])) {
                return $catalog[$id];
            }
        } catch (Throwable $e) {
            Log::warning('Cache indisponível no findById', ['error' => $e->getMessage()]);
        }

        // Rebuild se o catálogo expirou / sumiu.
        $this->forHome();

        try {
            $catalog = Cache::get(self::CATALOG_KEY);
            if (is_array($catalog) && isset($catalog[$id]) && is_array($catalog[$id])) {
                return $catalog[$id];
            }
        } catch (Throwable) {
            // ignore
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFresh(): array
    {
        $sourcesOk = [];
        $sourcesFailed = [];
        $buckets = [
            'br_environment' => [],
            'br_social' => [],
            'br_general' => [],
            'international' => [],
        ];

        foreach ($this->sources() as $meta) {
            /** @var NewsSource $source */
            $source = $meta['source'];
            $bucket = $meta['bucket'];

            try {
                $items = $source->fetch(12);
                $buckets[$bucket] = array_merge($buckets[$bucket], $items);
                $sourcesOk[] = $source->key();
            } catch (Throwable $e) {
                Log::warning('Fonte de notícias falhou', [
                    'source' => $source->key(),
                    'error' => $e->getMessage(),
                ]);
                $sourcesFailed[] = [
                    'key' => $source->key(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        $env = $this->dedupe($buckets['br_environment']);
        $social = $this->dedupe($buckets['br_social']);
        $general = $this->dedupe($buckets['br_general']);
        $international = $this->dedupe($buckets['international']);

        $catalog = [];
        foreach (array_merge($env, $social, $general, $international) as $article) {
            $catalog[(string) $article['id']] = $article;
        }

        try {
            Cache::put(self::CATALOG_KEY, $catalog, self::CACHE_TTL_SECONDS);
        } catch (Throwable $e) {
            Log::warning('Falha ao gravar catálogo de news', ['error' => $e->getMessage()]);
        }

        $envCount = count($env);
        $socialCount = count($social);
        $generalCount = count($general);
        $totalBr = $envCount + $socialCount + $generalCount;

        $internationalForHome = array_map(
            fn (array $item) => array_merge($item, [
                'path' => '/news/'.$item['id'],
            ]),
            array_slice($international, 0, 12),
        );

        return [
            'international' => $internationalForHome,
            'brazil' => [
                'stats' => [
                    'topics' => $envCount,
                    'members' => $socialCount,
                    'engagement_label' => 'Artigos BR',
                    'engagement_value' => (string) $totalBr,
                    'engagement_change_pct' => $totalBr > 0 ? 1.0 : 0.0,
                    'activity_24h' => (string) $generalCount,
                    'dominance_a_label' => 'Amb.',
                    'dominance_a_pct' => $totalBr > 0 ? round(($envCount / $totalBr) * 100, 1) : 0.0,
                    'dominance_b_label' => 'Soc.',
                    'dominance_b_pct' => $totalBr > 0 ? round(($socialCount / $totalBr) * 100, 1) : 0.0,
                ],
                'tracked' => [
                    'primary_value' => (string) $envCount,
                    'primary_label' => 'Meio ambiente (RSS)',
                    'primary_hint' => 'Agência Brasil',
                    'secondary_value' => (string) $socialCount,
                    'secondary_label' => 'Desenvolvimento social (RSS)',
                    'secondary_hint' => 'Direitos Humanos',
                ],
                'trending' => $this->toHighlightItems(array_slice($env, 0, 3)),
                'highlights' => $this->toHighlightItems(array_slice($social, 0, 3)),
                'table_environment' => $this->toTableRows(array_slice($env !== [] ? $env : $general, 0, 10)),
                'table_social' => $this->toTableRows(array_slice($social !== [] ? $social : $general, 0, 10)),
            ],
            'sources_ok' => $sourcesOk,
            'sources_failed' => $sourcesFailed,
            'cached' => false,
            'fetched_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @return list<array{source: NewsSource, bucket: string}>
     */
    private function sources(): array
    {
        return [
            [
                'bucket' => 'br_environment',
                'source' => new RssFeedSource(
                    'agencia-brasil-meio-ambiente',
                    'https://agenciabrasil.ebc.com.br/rss/meio-ambiente/feed.xml',
                    'Agência Brasil — Meio Ambiente',
                ),
            ],
            [
                'bucket' => 'br_social',
                'source' => new RssFeedSource(
                    'agencia-brasil-direitos-humanos',
                    'https://agenciabrasil.ebc.com.br/rss/direitos-humanos/feed.xml',
                    'Agência Brasil — Direitos Humanos',
                ),
            ],
            [
                'bucket' => 'br_general',
                'source' => new RssFeedSource(
                    'agencia-brasil-ultimas',
                    'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
                    'Agência Brasil — Últimas',
                ),
            ],
            [
                'bucket' => 'international',
                'source' => new GuardianEnvironmentSource,
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function dedupe(array $items): array
    {
        $seen = [];
        $out = [];
        foreach ($items as $item) {
            $url = (string) ($item['url'] ?? '');
            if ($url === '' || isset($seen[$url])) {
                continue;
            }
            $seen[$url] = true;
            $out[] = $item;
        }

        return $out;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function toHighlightItems(array $items): array
    {
        return array_map(function (array $item) {
            $title = (string) $item['title'];

            return [
                'id' => $item['id'],
                'name' => Str::limit($title, 42),
                'symbol' => Str::upper(Str::limit(Str::slug((string) $item['source']), 8, '')),
                'value_label' => $this->formatWhen($item['published_at'] ?? null),
                'change_pct' => 0.0,
                'url' => '/news/'.$item['id'],
            ];
        }, $items);
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function toTableRows(array $items): array
    {
        $rows = [];
        foreach (array_values($items) as $i => $item) {
            $title = (string) $item['title'];
            $rows[] = [
                'id' => $i + 1,
                'article_id' => (string) $item['id'],
                'rank' => $i + 1,
                'name' => Str::limit($title, 48),
                'symbol' => Str::upper(Str::limit(preg_replace('/[^A-Za-z]/', '', (string) $item['source']) ?: 'BR', 6, '')),
                'price_label' => Str::limit((string) ($item['summary'] ?? $item['source']), 28),
                'change_24h_pct' => 0.0,
                'metric_a' => (string) $item['source'],
                'metric_b' => $this->formatWhen($item['published_at'] ?? null),
                'updated_at' => $this->formatTime($item['published_at'] ?? null),
                'href' => '/news/'.$item['id'],
            ];
        }

        return $rows;
    }

    private function formatWhen(mixed $iso): string
    {
        if (! is_string($iso) || $iso === '') {
            return '—';
        }

        try {
            return \Carbon\Carbon::parse($iso)->timezone(config('app.timezone'))->format('d M Y');
        } catch (Throwable) {
            return '—';
        }
    }

    private function formatTime(mixed $iso): string
    {
        if (! is_string($iso) || $iso === '') {
            return '—';
        }

        try {
            return \Carbon\Carbon::parse($iso)->timezone(config('app.timezone'))->format('H:i:s');
        } catch (Throwable) {
            return '—';
        }
    }
}
