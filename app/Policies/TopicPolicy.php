<?php

namespace App\Policies;

use App\Models\Topic;
use App\Models\User;

class TopicPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function view(?User $user, Topic $topic): bool
    {
        return true;
    }

    public function vote(User $user, Topic $topic): bool
    {
        return true;
    }
}
