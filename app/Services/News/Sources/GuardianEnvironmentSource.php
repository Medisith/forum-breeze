<?php

namespace App\Services\News\Sources;

use App\Services\News\Contracts\NewsSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * The Guardian Open Platform — notícias internacionais (section=environment).
 * Docs: https://open-platform.theguardian.com/
 */
class GuardianEnvironmentSource implements NewsSource
{
    public function key(): string
    {
        return 'guardian-environment';
    }

    public function fetch(int $limit = 10): array
    {
        $apiKey = config('services.guardian.key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw new \RuntimeException('GUARDIAN_API_KEY não configurada');
        }

        $response = Http::timeout(20)->get('https://content.guardianapis.com/search', [
            'section' => 'environment',
            'order-by' => 'newest',
            'show-fields' => 'trailText,thumbnail',
            'page-size' => min($limit, 20),
            'api-key' => $apiKey,
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Guardian HTTP '.$response->status());
        }

        $results = data_get($response->json(), 'response.results', []);
        if (! is_array($results)) {
            return [];
        }

        $items = [];
        foreach ($results as $row) {
            if (! is_array($row)) {
                continue;
            }

            $title = trim((string) ($row['webTitle'] ?? ''));
            $url = trim((string) ($row['webUrl'] ?? ''));
            if ($title === '' || $url === '') {
                continue;
            }

            $trail = trim(html_entity_decode(strip_tags((string) data_get($row, 'fields.trailText', '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $thumb = data_get($row, 'fields.thumbnail');

            $items[] = [
                'id' => sha1('guardian|'.($row['id'] ?? $url)),
                'title' => $title,
                'url' => $url,
                'source' => 'The Guardian',
                'summary' => $trail !== '' ? Str::limit($trail, 220) : null,
                'image_url' => is_string($thumb) && $thumb !== '' ? $thumb : null,
                'published_at' => isset($row['webPublicationDate'])
                    ? (string) $row['webPublicationDate']
                    : null,
                'origin' => $this->key(),
            ];
        }

        return $items;
    }
}
