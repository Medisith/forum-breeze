<?php

use App\Http\Controllers\Forum\PostController;
use App\Http\Controllers\Forum\TopicController;
use App\Http\Controllers\Forum\VoteController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NewsController;
use Illuminate\Support\Facades\Route;

$prefix = trim((string) config('app.path_prefix'), '/');

Route::prefix($prefix)->group(function () {
    Route::get('/', HomeController::class)->name('home');

    Route::get('/news/{id}', [NewsController::class, 'show'])
        ->where('id', '[a-f0-9]{40}')
        ->name('news.show');

    Route::get('/forum', [TopicController::class, 'index'])->name('forum.index');

    Route::middleware('auth')->group(function () {
        Route::get('/forum/topics/create', [TopicController::class, 'create'])->name('forum.topics.create');
        Route::post('/forum/topics', [TopicController::class, 'store'])->name('forum.topics.store');
    });

    Route::get('/forum/topics/{topic}', [TopicController::class, 'show'])->name('forum.topics.show');

    Route::middleware('auth')->group(function () {
        Route::post('/forum/topics/{topic}/posts', [PostController::class, 'store'])->name('forum.posts.store');
        Route::post('/forum/topics/{topic}/vote', [VoteController::class, 'toggle'])->name('forum.topics.vote');
    });

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

    require __DIR__.'/settings.php';
});
