# API — Rotas web (Inertia)

Rotas HTTP da aplicação expostas via Laravel + Inertia/React. Não há API REST JSON separada nesta fase; respostas são páginas Inertia ou redirects.

Middleware global do grupo `web`: sessão, CSRF, cookies.

## Fórum

| Método | Rota | Nome | Middleware | Controller / página | Descrição |
| --- | --- | --- | --- | --- | --- |
| GET | `/forum` | `forum.index` | — | `TopicController@index` → `Forum/IndexPage` | Lista tópicos (paginação 15); query `?category=slug` |
| GET | `/forum/topics/create` | `forum.topics.create` | `auth` | `TopicController@create` → `Forum/CreateTopicPage` | Formulário de novo tópico |
| POST | `/forum/topics` | `forum.topics.store` | `auth` | `TopicController@store` | Cria tópico; redirect para `forum.topics.show` |
| GET | `/forum/topics/{topic}` | `forum.topics.show` | — | `TopicController@show` → `Forum/ShowPage` | Detalhe do tópico + posts |
| POST | `/forum/topics/{topic}/posts` | `forum.posts.store` | `auth` | `PostController@store` | Nova resposta (opcional `parent_id`) |
| POST | `/forum/topics/{topic}/vote` | `forum.topics.vote` | `auth` | `VoteController@toggle` | Toggle voto; atualiza `votes_count` |

**Leitura pública:** rotas GET do fórum não exigem `auth`. **Escrita:** POST exige `auth`; guest recebe redirect para login.

## Auth (Fortify)

| Método | Rota | Nome | Middleware | Descrição |
| --- | --- | --- | --- | --- |
| GET | `/register` | `register` | `guest` | Página de cadastro |
| POST | `/register` | `register.store` | `guest` | Cria usuário; redirect `/forum` |
| GET | `/login` | `login` | `guest` | Página de login |
| POST | `/login` | `login.store` | `guest` | Autentica; rate limit 5/min |
| POST | `/logout` | `logout` | `auth` | Encerra sessão |

## Outras rotas web

| Método | Rota | Nome | Middleware | Descrição |
| --- | --- | --- | --- | --- |
| GET | `/` | `home` | — | Página inicial (`welcome`) |
| GET | `/dashboard` | `dashboard` | `auth`, `verified` | Dashboard Inertia |

Rotas de settings em `routes/settings.php` (`profile.*`, `security.*`, `appearance.edit`) — middleware `auth` / `verified` conforme a rota.

## Validação (POST fórum)

**Tópico** (`StoreTopicRequest`): `title` (required, max 255), `body` (required), `category_id` (exists), `type` (enum `TopicType`).

**Post** (`StorePostRequest`): `body` (required), `parent_id` (nullable, exists em `posts` do mesmo tópico).
