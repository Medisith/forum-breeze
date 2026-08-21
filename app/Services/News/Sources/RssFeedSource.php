<?php

namespace App\Services\News\Sources;

use App\Services\News\Contracts\NewsSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class RssFeedSource implements NewsSource
{
    public function __construct(
        private readonly string $keyName,
        private readonly string $feedUrl,
        private readonly string $sourceLabel,
    ) {}

    public function key(): string
    {
        return $this->keyName;
    }

    public function fetch(int $limit = 10): array
    {
        $response = Http::timeout(20)
            ->withHeaders(['User-Agent' => 'ForumSustentavel/1.0 (+local)'])
            ->get($this->feedUrl);

        if (! $response->successful()) {
            throw new \RuntimeException("RSS HTTP {$response->status()} em {$this->feedUrl}");
        }

        $xml = @simplexml_load_string($response->body());
        if ($xml === false) {
            throw new \RuntimeException("RSS inválido: {$this->feedUrl}");
        }

        $items = [];
        $entries = $xml->channel->item ?? $xml->item ?? [];

        foreach ($entries as $item) {
            $title = trim((string) ($item->title ?? ''));
            $link = trim((string) ($item->link ?? ''));
            if ($title === '' || $link === '') {
                continue;
            }

            $summary = trim(html_entity_decode(strip_tags((string) ($item->description ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $published = trim((string) ($item->pubDate ?? ''));
            $publishedIso = null;
            if ($published !== '') {
                try {
                    $publishedIso = \Carbon\Carbon::parse($published)->toIso8601String();
                } catch (Throwable) {
                    $publishedIso = null;
                }
            }

            $image = null;
            if (isset($item->enclosure['url'])) {
                $image = (string) $item->enclosure['url'];
            }

            $items[] = [
                'id' => sha1($this->keyName.'|'.$link),
                'title' => $title,
                'url' => $link,
                'source' => $this->sourceLabel,
                'summary' => $summary !== '' ? Str::limit($summary, 220) : null,
                'image_url' => $image,
                'published_at' => $publishedIso,
                'origin' => $this->keyName,
            ];

            if (count($items) >= $limit) {
                break;
            }
        }

        if ($items === []) {
            Log::warning('RSS sem itens', ['source' => $this->keyName, 'url' => $this->feedUrl]);
        }

        return $items;
    }
}
