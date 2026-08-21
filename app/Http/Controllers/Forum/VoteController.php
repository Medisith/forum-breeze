<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\Vote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoteController extends Controller
{
    public function toggle(Request $request, Topic $topic): RedirectResponse
    {
        $this->authorize('vote', $topic);

        DB::transaction(function () use ($request, $topic): void {
            $vote = Vote::query()
                ->where('user_id', $request->user()->id)
                ->where('topic_id', $topic->id)
                ->first();

            if ($vote) {
                $vote->delete();
                $topic->decrement('votes_count');
            } else {
                Vote::query()->create([
                    'user_id' => $request->user()->id,
                    'topic_id' => $topic->id,
                ]);
                $topic->increment('votes_count');
            }
        });

        return back();
    }
}
