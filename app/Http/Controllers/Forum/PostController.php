<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\Forum\StorePostRequest;
use App\Models\Post;
use App\Models\Topic;
use Illuminate\Http\RedirectResponse;

class PostController extends Controller
{
    public function store(StorePostRequest $request, Topic $topic): RedirectResponse
    {
        $this->authorize('create', Post::class);

        $topic->posts()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return back();
    }
}
