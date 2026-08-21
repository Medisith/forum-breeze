<?php

namespace App\Http\Controllers;

use App\Services\News\NewsAggregator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NewsController extends Controller
{
    public function show(string $id, NewsAggregator $news): Response
    {
        $article = $news->findById($id);

        if ($article === null) {
            throw new NotFoundHttpException('Notícia não encontrada ou expirada do cache.');
        }

        return Inertia::render('News/ShowPage', [
            'article' => $article,
        ]);
    }
}
