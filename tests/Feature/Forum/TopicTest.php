<?php

namespace Tests\Feature\Forum;

use App\Enums\TopicType;
use App\Models\Category;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopicTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_forum_index(): void
    {
        $this->get(route('forum.index'))->assertOk();
    }

    public function test_guest_cannot_store_topic(): void
    {
        $this->post(route('forum.topics.store'), [])->assertRedirect(route('login'));
    }

    public function test_auth_user_can_toggle_vote(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Test',
            'slug' => 'test',
        ]);
        $topic = Topic::query()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Test Topic',
            'body' => 'Body',
            'type' => TopicType::Discussao,
            'votes_count' => 0,
        ]);

        $this->actingAs($user);

        $this->post(route('forum.topics.vote', $topic));
        $topic->refresh();
        $this->assertSame(1, $topic->votes_count);

        $this->post(route('forum.topics.vote', $topic));
        $topic->refresh();
        $this->assertSame(0, $topic->votes_count);
    }
}
