<?php

use App\Http\Controllers\Forum\PostController;
use App\Http\Controllers\Forum\TopicController;
use App\Http\Controllers\Forum\VoteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

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
