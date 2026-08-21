<?php

namespace App\Http\Controllers;

use App\Services\News\NewsAggregator;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(NewsAggregator $news): Response
    {
        $payload = $news->forHome();

        return Inertia::render('welcome', [
            'feed' => $payload,
        ]);
    }
}
