<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$n = app(App\Services\News\NewsAggregator::class)->forHome();

echo 'ok=' . count($n['sources_ok']) . ' fail=' . count($n['sources_failed'])
    . ' intl=' . count($n['international'])
    . ' env=' . count($n['brazil']['table_environment'])
    . ' social=' . count($n['brazil']['table_social']) . PHP_EOL;

echo 'sources_ok: ' . implode(', ', $n['sources_ok']) . PHP_EOL;

foreach ($n['sources_failed'] as $f) {
    echo 'FAIL ' . $f['key'] . ': ' . $f['error'] . PHP_EOL;
}

if (! empty($n['brazil']['table_environment'][0]['name'])) {
    echo 'sample_env: ' . $n['brazil']['table_environment'][0]['name'] . PHP_EOL;
}
