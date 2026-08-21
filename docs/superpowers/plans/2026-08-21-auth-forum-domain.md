# Auth + Domínio do Fórum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar Fortify para Auth (Login/Register pages com zod+RHF, redirect `/forum`, rate limit documentado) e implementar domínio do fórum (categories, topics, posts, votes) com seed e UI Inertia.

**Architecture:** Backend Fortify permanece; views Inertia passam a `Auth/LoginPage` e `Auth/RegisterPage`. Domínio MVC clássico: migrations → models/policies/Form Requests → controllers finos → rotas web → páginas Inertia. Voto toggle em transaction com `UNIQUE(user_id, topic_id)`.

**Tech Stack:** Laravel 13, Fortify, Inertia 3, React 19, TypeScript, zod, react-hook-form, MySQL 8, Redis (sessão), Tailwind v4 / shadcn do starter.

## Global Constraints

- LOCAL SEM DOCKER; PHP/Composer/Node/MySQL/Redis nativos.
- Secrets só em `.env`; documentar em `.env.example`.
- Não instruir Docker para desenvolvimento local.
- Commits: só se o usuário pedir explicitamente; sem trailers AI/Co-authored-by.
- Changelog: `docs/changelog/YYYY-MM-DD-slug.md` + entrada no README + docs afetados.
- 2FA/passkeys: código permanece; UI de login/registro não as expõe.
- Rate limit login: 5/min por `email|ip` (Fortify).
- Pós-login: `/forum`.
- Spec: `docs/superpowers/specs/2026-08-21-auth-forum-domain-design.md`.

## File map

| Path | Responsibility |
| --- | --- |
| `config/fortify.php` | `home` → `/forum` |
| `app/Providers/FortifyServiceProvider.php` | Render `Auth/LoginPage`, `Auth/RegisterPage` |
| `resources/js/pages/Auth/LoginPage.tsx` | Login zod+RHF |
| `resources/js/pages/Auth/RegisterPage.tsx` | Register zod+RHF |
| `resources/js/app.tsx` | Layout para `Auth/` |
| `routes/web.php` | Forum routes + remove verified-only dashboard dependency pós-login |
| `database/migrations/*_create_forum_tables.php` | Schema |
| `app/Models/{Category,Topic,Post,Vote}.php` | Eloquent |
| `app/Enums/TopicType.php` | Enum types |
| `app/Http/Controllers/Forum/*.php` | Controllers |
| `app/Http/Requests/Forum/*.php` | Form Requests |
| `app/Policies/{TopicPolicy,PostPolicy}.php` | Authz |
| `database/seeders/*` | Categories, admin, topics |
| `resources/js/pages/Forum/*.tsx` | UI |
| `docs/domain.md`, `docs/api.md`, changelog, README, setup | Docs |

---

### Task 1: Redirect Fortify + placeholder `/forum` + testes auth

**Files:**
- Modify: `config/fortify.php` (`home`)
- Modify: `routes/web.php`
- Create: `resources/js/pages/Forum/IndexPage.tsx` (placeholder autenticável; Fase 2 troca conteúdo)
- Modify: `tests/Feature/Auth/AuthenticationTest.php`, `RegistrationTest.php` (assert redirect `/forum`)
- Modify: `bootstrap/app.php` se `redirectUsersTo` / guests apontarem dashboard

**Interfaces:**
- Consumes: Fortify routes existentes
- Produces: `route('forum.index')` → `/forum`; pós-login → `/forum`

- [ ] **Step 1: Atualizar testes de redirect**

Em `AuthenticationTest::test_users_can_authenticate_using_the_login_screen` e equivalente em `RegistrationTest`, trocar:

```php
$response->assertRedirect(route('forum.index', absolute: false));
```

(criar nome `forum.index` no mesmo task)

- [ ] **Step 2: Rodar testes e confirmar falha**

```powershell
php artisan test --filter=AuthenticationTest
```

Expected: FAIL no assertRedirect (ainda `/dashboard`).

- [ ] **Step 3: Implementar redirect e rota placeholder**

`config/fortify.php`:

```php
'home' => '/forum',
```

`routes/web.php`:

```php
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::get('/forum', function () {
    return Inertia::render('Forum/IndexPage', [
        'topics' => [],
        'categories' => [],
        'filters' => ['category' => request('category')],
    ]);
})->name('forum.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
```

`resources/js/pages/Forum/IndexPage.tsx`:

```tsx
import { Head } from '@inertiajs/react';

type Props = {
    topics: unknown[];
    categories: unknown[];
    filters: { category?: string | null };
};

export default function IndexPage({ filters }: Props) {
    return (
        <>
            <Head title="Fórum" />
            <div className="mx-auto max-w-4xl p-6">
                <h1 className="text-2xl font-semibold">Fórum Sustentável</h1>
                <p className="mt-2 text-muted-foreground">
                    Área do fórum{filters.category ? ` — ${filters.category}` : ''}.
                </p>
            </div>
        </>
    );
}
```

`resources/js/app.tsx` — incluir layout App para `Forum/`:

```tsx
case name.startsWith('Auth/'):
    return AuthLayout;
case name.startsWith('auth/'):
    return AuthLayout;
```

(Auth pages na Task 2.)

- [ ] **Step 4: Testes passam**

```powershell
php artisan test --filter=AuthenticationTest
php artisan test --filter=RegistrationTest
```

Expected: PASS nos redirects para forum.

---

### Task 2: Login/Register pages (zod + RHF) sem passkeys na UI

**Files:**
- Create: `resources/js/pages/Auth/LoginPage.tsx`
- Create: `resources/js/pages/Auth/RegisterPage.tsx`
- Modify: `app/Providers/FortifyServiceProvider.php`
- Modify: `package.json` (deps)
- Modify: `resources/js/app.tsx`
- Keep: `resources/js/pages/auth/*` (reset/2FA/etc.) ou deixar; login/register antigos podem permanecer sem uso

**Interfaces:**
- Consumes: rotas Wayfinder `login.store`, `register.store`, `logout`
- Produces: Inertia components `Auth/LoginPage`, `Auth/RegisterPage`

- [ ] **Step 1: Instalar deps**

```powershell
npm install zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Criar LoginPage**

```tsx
import { Head, router, usePage } from '@inertiajs/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';
import { register as registerRoute } from '@/routes';
import { request } from '@/routes/password';

const schema = z.object({
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(1, 'Informe a senha'),
    remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function LoginPage({ status, canResetPassword }: Props) {
    const pageErrors = usePage().props.errors as Record<string, string>;
    const [processing, setProcessing] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '', remember: false },
    });

    const onSubmit = (data: FormData) => {
        setProcessing(true);
        router.post(store.url(), data, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Entrar" />
            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">{status}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
                <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" autoComplete="email" autoFocus {...register('email')} />
                    <InputError message={errors.email?.message || pageErrors.email} />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Senha</Label>
                        {canResetPassword && (
                            <TextLink href={request()} className="ml-auto text-sm">
                                Esqueceu a senha?
                            </TextLink>
                        )}
                    </div>
                    <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
                    <InputError message={errors.password?.message || pageErrors.password} />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remember"
                        checked={watch('remember')}
                        onCheckedChange={(v) => setValue('remember', v === true)}
                    />
                    <Label htmlFor="remember">Lembrar de mim</Label>
                </div>
                <Button type="submit" disabled={processing}>
                    Entrar
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    Não tem conta? <TextLink href={registerRoute()}>Cadastre-se</TextLink>
                </p>
            </form>
        </>
    );
}
```

- [ ] **Step 3: Criar RegisterPage** (campos name, email, password, password_confirmation; zod; POST `register.store`; sem 2FA/passkeys)

Espelho do Login com schema:

```ts
const schema = z
    .object({
        name: z.string().min(1, 'Informe o nome'),
        email: z.string().email('Informe um e-mail válido'),
        password: z.string().min(8, 'Mínimo de 8 caracteres'),
        password_confirmation: z.string().min(1, 'Confirme a senha'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'As senhas não coincidem',
        path: ['password_confirmation'],
    });
```

- [ ] **Step 4: Apontar Fortify**

```php
Fortify::loginView(fn (Request $request) => Inertia::render('Auth/LoginPage', [
    'canResetPassword' => Features::enabled(Features::resetPasswords()),
    'status' => $request->session()->get('status'),
]));

Fortify::registerView(fn () => Inertia::render('Auth/RegisterPage', [
    'passwordRules' => Password::defaults()->toPasswordRulesString(),
]));
```

- [ ] **Step 5: Verificar render**

```powershell
php artisan test --filter=test_login_screen_can_be_rendered
php artisan test --filter=test_registration_screen_can_be_rendered
```

Expected: PASS. Manual: login sem PasskeyVerify no HTML.

---

### Task 3: Docs Auth (Fase 1) + assert hash

**Files:**
- Create: `docs/domain.md` (seção Auth)
- Create: `docs/changelog/2026-08-21-auth.md`
- Modify: `README.md` (Changelog)
- Modify: `docs/setup.md` (smoke register/login/logout + rate limit)
- Modify: `tests/Feature/Auth/RegistrationTest.php` (assert `Hash::check` / `Hash::isHashed`)

- [ ] **Step 1: Teste de hash**

```php
public function test_registration_stores_hashed_password(): void
{
    $this->post(route('register.store'), [
        'name' => 'Ana',
        'email' => 'ana@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'ana@example.com')->first();
    $this->assertNotNull($user);
    $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $user->password));
    $this->assertNotSame('password', $user->password);
}
```

- [ ] **Step 2: Rodar teste → FAIL se register quebrado; senão PASS**

- [ ] **Step 3: Documentar**

Em `docs/domain.md`: usuários, register/login/logout, bcrypt, sessão regenerate, remember me, rate limit 5/min, erro genérico.

Em `docs/setup.md`: fluxo smoke auth; nota do throttle.

Changelog + README.

---

### Task 4: Migrations + Enum + Models

**Files:**
- Create: `database/migrations/2026_08_21_100000_create_forum_tables.php`
- Create: `app/Enums/TopicType.php`
- Create: `app/Models/Category.php`, `Topic.php`, `Post.php`, `Vote.php`
- Modify: `app/Models/User.php` (relations)

**Interfaces:**
- Produces: `TopicType` cases `Discussao`, `Sugestao`, `Proposta`, `Material` com values `discussao|sugestao|proposta|material`
- Models com fillable/casts/relations conforme schema do spec

- [ ] **Step 1: Migration**

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->timestamps();
});

Schema::create('topics', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('body');
    $table->string('type'); // discussao|sugestao|proposta|material
    $table->unsignedInteger('votes_count')->default(0);
    $table->timestamps();
});

Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->text('body');
    $table->foreignId('parent_id')->nullable()->constrained('posts')->nullOnDelete();
    $table->timestamps();
});

Schema::create('votes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['user_id', 'topic_id']);
});
```

- [ ] **Step 2: Enum TopicType**

```php
namespace App\Enums;

enum TopicType: string
{
    case Discussao = 'discussao';
    case Sugestao = 'sugestao';
    case Proposta = 'proposta';
    case Material = 'material';
}
```

- [ ] **Step 3: Models** — Category `hasMany` topics; Topic belongsTo user/category, hasMany posts/votes, cast type→TopicType; Post belongsTo topic/user/parent; Vote belongsTo user/topic; User hasMany topics/posts/votes.

- [ ] **Step 4: Migrar**

```powershell
php artisan migrate --force
```

Expected: OK sem erro.

---

### Task 5: Policies + Form Requests + Controllers + rotas

**Files:**
- Create: `app/Policies/TopicPolicy.php`, `PostPolicy.php`
- Create: `app/Http/Requests/Forum/StoreTopicRequest.php`, `StorePostRequest.php`
- Create: `app/Http/Controllers/Forum/TopicController.php`, `PostController.php`, `VoteController.php`
- Modify: `routes/web.php` (substituir closure de `/forum`)
- Modify: `app/Providers/AppServiceProvider.php` se precisar registrar policies (auto-discovery Laravel)

**Interfaces:**
- `TopicController@index(Request): Response` — filtro `?category=`
- `TopicController@create`, `@store(StoreTopicRequest)`, `@show(Topic)`
- `PostController@store(StorePostRequest, Topic)`
- `VoteController@toggle(Topic)` — transaction

- [ ] **Step 1: Testes feature falhando**

`tests/Feature/Forum/TopicTest.php`:

```php
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
    // setup category+topic; actingAs; post vote twice; assert votes_count 1 then 0
}
```

- [ ] **Step 2: Rodar → FAIL (rotas inexistentes)**

- [ ] **Step 3: Policies**

```php
// TopicPolicy
public function create(User $user): bool { return true; }
public function view(?User $user, Topic $topic): bool { return true; }
```

Post: create se autenticado; view público.

- [ ] **Step 4: Controllers**

`TopicController@index`:

```php
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
```

`show`:

```php
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
```

`VoteController@toggle`:

```php
DB::transaction(function () use ($request, $topic) {
    $vote = Vote::query()->where('user_id', $request->user()->id)->where('topic_id', $topic->id)->first();
    if ($vote) {
        $vote->delete();
        $topic->decrement('votes_count');
    } else {
        Vote::create(['user_id' => $request->user()->id, 'topic_id' => $topic->id]);
        $topic->increment('votes_count');
    }
});
return back();
```

- [ ] **Step 5: Rotas**

```php
use App\Http\Controllers\Forum\PostController;
use App\Http\Controllers\Forum\TopicController;
use App\Http\Controllers\Forum\VoteController;

Route::get('/forum', [TopicController::class, 'index'])->name('forum.index');
Route::get('/forum/topics/{topic}', [TopicController::class, 'show'])->name('forum.topics.show');

Route::middleware('auth')->group(function () {
    Route::get('/forum/topics/create', [TopicController::class, 'create'])->name('forum.topics.create');
    Route::post('/forum/topics', [TopicController::class, 'store'])->name('forum.topics.store');
    Route::post('/forum/topics/{topic}/posts', [PostController::class, 'store'])->name('forum.posts.store');
    Route::post('/forum/topics/{topic}/vote', [VoteController::class, 'toggle'])->name('forum.topics.vote');
});
```

**Nota:** declarar `topics/create` **antes** de `topics/{topic}` (já feito acima: create dentro do group auth, show público — em Laravel ordem importa: colocar `create` antes de `{topic}` no arquivo).

Ordem correta:

```php
Route::get('/forum', ...)->name('forum.index');
Route::middleware('auth')->group(function () {
    Route::get('/forum/topics/create', ...);
    Route::post('/forum/topics', ...);
});
Route::get('/forum/topics/{topic}', ...);
Route::middleware('auth')->group(function () {
    Route::post('/forum/topics/{topic}/posts', ...);
    Route::post('/forum/topics/{topic}/vote', ...);
});
```

- [ ] **Step 6: Testes PASS**

```powershell
php artisan test --filter=Forum
```

---

### Task 6: UI Inertia do fórum

**Files:**
- Modify: `resources/js/pages/Forum/IndexPage.tsx`
- Create: `resources/js/pages/Forum/CreateTopicPage.tsx`
- Create: `resources/js/pages/Forum/ShowPage.tsx`
- Modify: `resources/js/components/app-sidebar.tsx` ou nav (link Fórum)
- Modify: `resources/js/pages/welcome.tsx` (CTA fórum; remover ou manter Deploy now — preferir link Entrar/Fórum)

**Interfaces:**
- Props Index: paginated topics, categories, filters
- Create: categories list + TopicType options
- Show: topic, userHasVoted, form post

- [ ] **Step 1: Index** — lista títulos, categoria, type, votes_count, link show; filtro por slug; botão "Novo tópico" se auth.

- [ ] **Step 2: Create** — form (RHF+zod ou Inertia Form) title, body, category_id, type → POST store.

- [ ] **Step 3: Show** — body, posts, form resposta (auth), botão voto toggle (auth).

- [ ] **Step 4: `npm run build` OK**

---

### Task 7: Seeders

**Files:**
- Create: `database/seeders/CategorySeeder.php`
- Create: `database/seeders/ForumDemoSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Admin: `admin@forum.test` / `password` (documentar em setup/domain; só local)
- 5 categories com slugs do spec
- ≥ 8 topics cobrindo todas as categorias

- [ ] **Step 1: CategorySeeder** com os 5 slugs/names/descriptions.

- [ ] **Step 2: ForumDemoSeeder** — User admin + 8+ topics + alguns posts.

- [ ] **Step 3: DatabaseSeeder chama ambos.**

- [ ] **Step 4: Banco limpo**

```powershell
php artisan migrate:fresh --seed --force
```

Expected: OK; 5 categories; ≥8 topics.

---

### Task 8: Docs Fase 2 + verificação final

**Files:**
- Modify: `docs/domain.md` (entidades, regras voto, leitura pública)
- Create: `docs/api.md` (tabela de rotas web)
- Create: `docs/changelog/2026-08-21-forum-domain.md`
- Modify: `README.md` Changelog
- Modify: `docs/README.md` índice
- Add: `dump.rdb` ao `.gitignore` se ainda não

- [ ] **Step 1: Escrever docs** conforme spec.

- [ ] **Step 2: Checklist aceite**

```powershell
php artisan migrate:fresh --seed --force
php artisan test
redis-cli ping
```

Manual: guest GET `/forum` OK; POST topic → login; vote toggle altera `votes_count`.

- [ ] **Step 3: Confirmar nenhum docker-compose local novo.**

---

## Spec coverage (self-review)

| Requisito | Task |
| --- | --- |
| Register/login/logout Fortify | 1–2 |
| Password hashed | 3 |
| zod + RHF | 2 |
| Rate limit 5/min documentado | 3 |
| Session regenerate / remember | Fortify + LoginPage |
| Auth/LoginPage, RegisterPage | 2 |
| Pós-login `/forum` | 1 |
| Schema + categorias seed | 4, 7 |
| Leitura pública / escrita auth | 5 |
| Vote toggle transaction | 5 |
| Rotas/UI | 5–6 |
| Seed admin + ≥8 topics | 7 |
| domain.md, api.md, changelog | 3, 8 |

Sem placeholders TBD. Tipos de tópico alinhados ao enum `TopicType`.
