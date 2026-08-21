# Domínio — Fórum Sustentável

Documentação de regras de negócio e comportamento da aplicação. Ambiente de desenvolvimento: **local, sem Docker** (MySQL + Redis nativos).

## Auth (Fase 1)

Autenticação via **Laravel Fortify**: cadastro, login e logout. Usuários persistidos na tabela `users` do MySQL.

### Usuários

| Campo | Regra |
| --- | --- |
| `name` | Obrigatório; string |
| `email` | Obrigatório; único; formato válido |
| `password` | Obrigatório; regras `Password::default()` (Fortify); nunca armazenado em texto plano |

O model `User` usa cast Eloquent `password` → `hashed` (bcrypt). A action `CreateNewUser` recebe a senha em plaintext na requisição; o cast aplica o hash antes de gravar.

### Rotas (Fortify)

| Método | Rota | Nome | Middleware |
| --- | --- | --- | --- |
| GET | `/register` | `register` | `guest` |
| POST | `/register` | `register.store` | `guest` |
| GET | `/login` | `login` | `guest` |
| POST | `/login` | `login.store` | `guest` |
| POST | `/logout` | `logout` | `auth` |

Pós-login e pós-cadastro: redirect para `/forum` (`config('fortify.home')` → `route('forum.index')`).

### Register

1. GET `/register` renderiza `Auth/RegisterPage` (Inertia).
2. POST valida `name`, `email`, `password` (+ confirmação) no servidor (`CreateNewUser`).
3. Usuário criado com senha hasheada (bcrypt).
4. Sessão autenticada; redirect para `/forum`.

### Login

1. GET `/login` renderiza `Auth/LoginPage` (Inertia).
2. POST valida credenciais via Fortify.
3. **Regenerate session** após login bem-sucedido (proteção contra fixation).
4. Campo opcional **`remember`**: quando marcado, Fortify emite cookie “lembrar de mim” (`remember_token` no user).
5. Redirect para `/forum`.

**Erro de credencial inválida:** resposta genérica (“These credentials do not match our records.” / equivalente traduzido). Não revela se o e-mail existe ou se a senha está errada.

### Logout

1. POST `/logout` (middleware `auth`).
2. Fortify invalida a sessão e chama **`regenerateToken()`** (CSRF).
3. Redirect para `/` (`route('home')`).

### Rate limit (login)

Limiter `login` no `FortifyServiceProvider`:

- **5 tentativas por minuto** por chave `transliterate(strtolower(email)) | ip`.
- Após exceder: HTTP 429 (Too Many Requests).
- Documentado para operação e smoke tests em [setup.md](setup.md).

2FA e passkeys permanecem no código Fortify, mas **não são expostos na UI** de login/registro nesta fase.

### Frontend (Auth)

- `resources/js/pages/Auth/LoginPage.tsx` — zod + react-hook-form; checkbox “Lembrar de mim”.
- `resources/js/pages/Auth/RegisterPage.tsx` — zod + react-hook-form; confirmação de senha.
- Submit via Inertia (`router.post`) para rotas Fortify nomeadas (Wayfinder).

### Critérios de aceite (Fase 1)

1. Register grava user com hash bcrypt no MySQL (não plaintext).
2. Logout + login com as mesmas credenciais funciona.
3. Credencial inválida → erro genérico; rate limit 5/min aplicado e documentado.

## Fórum (Fase 2)

Entidades do domínio do fórum: **categorias**, **tópicos**, **posts** (respostas) e **votos**. UI via Inertia/React; persistência no MySQL.

### Entidades

#### Category (`categories`)

| Campo | Regra |
| --- | --- |
| `name` | Obrigatório; nome exibido |
| `slug` | Obrigatório; único; usado em filtros (`?category=slug`) |
| `description` | Opcional |

Cinco categorias seedadas por `CategorySeeder`: Problemas Ambientais Locais, Sustentabilidade, Materiais Educativos, Propostas de Melhoria, Desenvolvimento Social.

#### Topic (`topics`)

| Campo | Regra |
| --- | --- |
| `user_id` | Autor; FK `users` |
| `category_id` | FK `categories` |
| `title` | Obrigatório; máx. 255 caracteres |
| `body` | Obrigatório; texto do tópico |
| `type` | Enum `TopicType` (ver abaixo) |
| `votes_count` | Contador desnormalizado; default `0` |

**Tipos de tópico** (`App\Enums\TopicType`):

| Valor | Case |
| --- | --- |
| `discussao` | `Discussao` |
| `sugestao` | `Sugestao` |
| `proposta` | `Proposta` |
| `material` | `Material` |

#### Post (`posts`)

| Campo | Regra |
| --- | --- |
| `topic_id` | FK `topics` |
| `user_id` | Autor |
| `body` | Obrigatório |
| `parent_id` | Opcional; FK `posts` para respostas aninhadas |

#### Vote (`votes`)

| Campo | Regra |
| --- | --- |
| `user_id` | Quem votou |
| `topic_id` | Tópico votado |
| — | Índice único `(user_id, topic_id)` — um voto por usuário por tópico |

### Leitura pública / escrita autenticada

| Ação | Guest | Autenticado |
| --- | --- | --- |
| Listar fórum (`GET /forum`) | ✅ | ✅ |
| Ver tópico (`GET /forum/topics/{topic}`) | ✅ | ✅ |
| Criar tópico | ❌ → login | ✅ (`auth`) |
| Responder tópico | ❌ → login | ✅ (`auth`) |
| Votar em tópico | ❌ → login | ✅ (`auth`) |

Policies (`TopicPolicy`, `PostPolicy`) permitem `view`/`create`/`vote` para usuários autenticados; o middleware `auth` nas rotas de escrita bloqueia guests antes da policy.

### Voto (toggle)

Rota `POST /forum/topics/{topic}/vote` (`VoteController@toggle`):

1. Requer autenticação (`auth`).
2. Executa em **transação DB**:
   - Se já existe `Vote` para `(user_id, topic_id)`: remove o voto e **decrementa** `topics.votes_count`.
   - Caso contrário: cria o voto e **incrementa** `topics.votes_count`.
3. Redirect `back()` (permanece na página do tópico).

O contador `votes_count` é mantido em sincronia com a tabela `votes`; não há voto negativo.

### Seed de demonstração (somente local)

`php artisan migrate:fresh --seed` executa `CategorySeeder` + `ForumDemoSeeder`:

- Usuário demo **`admin@forum.test`** / senha **`password`** — **apenas para desenvolvimento local**; não usar em produção.
- ≥ 10 tópicos distribuídos nas categorias e posts de exemplo (incluindo resposta aninhada).

### Frontend (Fórum)

- `Forum/IndexPage` — listagem paginada (15) com filtro por categoria.
- `Forum/ShowPage` — tópico, posts e botão de voto (autenticado).
- `Forum/CreateTopicPage` — formulário zod + react-hook-form; submit via Inertia.

### Critérios de aceite (Fase 2)

1. Guest acessa `GET /forum` e `GET /forum/topics/{topic}` sem login.
2. Guest em `POST /forum/topics` → redirect para login.
3. Usuário autenticado cria tópico e resposta; voto alterna `votes_count` (0 ↔ 1) na mesma sessão.
4. Seed popula categorias, admin demo e conteúdo de exemplo.
