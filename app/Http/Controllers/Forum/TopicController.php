<?php

namespace App\Http\Controllers\Forum;

use App\Enums\TopicType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Forum\StoreTopicRequest;
use App\Models\Category;
use App\Models\Topic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    public function index(Request $request): Response
    {
        $categorySlug = $request->string('category')->toString() ?: null;
        $categories = Category::query()->orderBy('name')->get();
        $topics = Topic::query()
            ->with(['user:id,name', 'category:id,name,slug'])
            ->when($categorySlug, fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $categorySlug)))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Forum/IndexPage', [
            'topics' => $topics,
            'categories' => $categories,
            'filters' => ['category' => $categorySlug],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Topic::class);

        return Inertia::render('Forum/CreateTopicPage', [
            'categories' => Category::query()->orderBy('name')->get(),
            'topicTypes' => collect(TopicType::cases())->map(fn (TopicType $type) => [
                'value' => $type->value,
                'label' => ucfirst($type->value),
            ])->values(),
        ]);
    }

    public function store(StoreTopicRequest $request): RedirectResponse
    {
        $this->authorize('create', Topic::class);

        $topic = Topic::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('forum.topics.show', $topic);
    }

    public function show(Request $request, Topic $topic): Response
    {
        $this->authorize('view', $topic);

        $topic->load([
            'user:id,name',
            'category:id,name,slug',
            'posts' => fn ($q) => $q->with('user:id,name')->orderBy('created_at'),
        ]);
        $userVote = $request->user()
            ? $topic->votes()->where('user_id', $request->user()->id)->exists()
            : false;

        return Inertia::render('Forum/ShowPage', [
            'topic' => $topic,
            'userHasVoted' => $userVote,
        ]);
    }
}
