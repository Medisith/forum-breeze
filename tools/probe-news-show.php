<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$agg = app(App\Services\News\NewsAggregator::class);
$home = $agg->forHome();
$id = $home['brazil']['trending'][0]['id'] ?? null;
echo 'id=' . ($id ?? 'null') . PHP_EOL;
echo 'href=' . ($home['brazil']['table_environment'][0]['href'] ?? '') . PHP_EOL;

if ($id) {
    $article = $agg->findById($id);
    echo 'found=' . ($article ? 'yes' : 'no') . PHP_EOL;
    echo 'title=' . ($article['title'] ?? '') . PHP_EOL;
}
