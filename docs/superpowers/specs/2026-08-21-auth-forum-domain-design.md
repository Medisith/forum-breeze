# Design: Fase 1 Auth + Fase 2 Domínio do fórum

**Data:** 2026-08-21  
**Projeto:** Fórum Sustentável (TCC)  
**Ambiente:** LOCAL SEM DOCKER (PHP, Composer, Node, MySQL, Redis nativos)

## Contexto

A Fase 0 entregou Laravel 13 + Fortify + Inertia/React/TS + Tailwind v4, MySQL e Redis locais. Auth Fortify já existe; o domínio do fórum ainda não.

Decisões confirmadas:

- Adaptar Fortify (não reescrever auth do zero).
- 2FA/passkeys permanecem no código; UI de login/registro não as expõe nesta fase.
- Rate limit de login: 5 tentativas/minuto por `email|IP` (padrão Fortify), documentado.
- Pós-login → `/forum`.

## Fase 1 — Auth

### Objetivo

Register / login / logout com usuário no MySQL, sessão segura, validação server + client.

### Backend

| Item | Comportamento |
| --- | --- |
| Rotas | Fortify: GET/POST register, GET/POST login, POST logout |
| Password | Cast Eloquent `hashed` (bcrypt); nunca plaintext |
| Form Requests / Actions | Manter `CreateNewUser` + regras; Form Requests onde o fluxo app exigir; validação Fortify no store |
| Rate limit | Limiter `login`: 5/min por `transliterate(email)\|ip` |
| Sessão | Regenerate no login (Fortify); logout: invalidate + regenerateToken |
| Remember me | Campo `remember` no login |
| Redirect | `config('fortify.home')` = `/forum` |
| Middleware | Views auth com `guest`; rotas autenticadas com `auth` |
| Erro login | Mensagem genérica (credenciais inválidas); throttle documentado |

### Frontend

- Páginas Inertia: `resources/js/pages/Auth/LoginPage.tsx`, `Auth/RegisterPage.tsx`.
- FortifyServiceProvider renderiza esses componentes.
- Dependências: `zod` + `react-hook-form` (+ `@hookform/resolvers`).
- Submit via Inertia (`router.post` / `useForm` alinhado a RHF) para as rotas Fortify.
- Sem UI de Passkey / 2FA no login nesta fase.

### Placeholder autenticado

- `GET /forum` (middleware `auth`) como destino pós-login até a listagem da Fase 2 substituir o placeholder.

### Documentação (Fase 1)

- `docs/domain.md` (seção Auth).
- Changelog + entrada no README.
- Atualizar `docs/setup.md` (fluxo auth / smoke test register-login-logout).

### Critérios de aceite (Fase 1)

1. Register grava user com hash no MySQL.
2. Logout + login de novo com as mesmas credenciais funciona.
3. Credencial inválida → erro genérico; rate limit 5/min documentado.

## Fase 2 — Domínio do fórum

### Objetivo

MVC + MySQL: categorias, tópicos, comentários (posts) e votos.

### Schema

**categories**

- `name`, `slug` (unique), `description`
- timestamps

**topics**

- `user_id` (FK users)
- `category_id` (FK categories)
- `title`, `body`
- `type` enum: `discussao`, `sugestao`, `proposta`, `material`
- `votes_count` unsigned int default 0
- timestamps

**posts**

- `topic_id`, `user_id`, `body`
- `parent_id` nullable (FK posts, threads de resposta)
- timestamps

**votes**

- `user_id`, `topic_id`
- `UNIQUE(user_id, topic_id)`
- timestamps (opcional)

### Categorias (seed)

1. `problemas-ambientais-locais`
2. `sustentabilidade`
3. `materiais-educativos`
4. `propostas-de-melhoria`
5. `desenvolvimento-social`

### Autorização

| Ação | Guest | Auth |
| --- | --- | --- |
| Listar / ver tópico | sim | sim |
| Criar tópico / post | não | sim |
| Toggle voto | não | sim |

Policies em Topic/Post/Vote (ou Topic + Post). Controllers finos; Form Requests; eager load na show (author, category, posts.user, user vote) — sem N+1.

### Upvote toggle

1. Transação DB.
2. Se já existe voto do user no tópico → delete + `votes_count--`.
3. Senão → create + `votes_count++`.
4. Resposta Inertia/redirect coerente com o novo `votes_count`.

### Rotas (web)

| Método | URI | Nome sugerido | Middleware |
| --- | --- | --- | --- |
| GET | `/forum` | `forum.index` | — (público) |
| GET | `/forum/topics/create` | `forum.topics.create` | `auth` |
| POST | `/forum/topics` | `forum.topics.store` | `auth` |
| GET | `/forum/topics/{topic}` | `forum.topics.show` | — |
| POST | `/forum/topics/{topic}/posts` | `forum.posts.store` | `auth` |
| POST | `/forum/topics/{topic}/vote` | `forum.topics.vote` | `auth` |

Filtro: `GET /forum?category={slug}`.

Pós-login Fortify continua apontando para `/forum` (agora listagem real).

### UI Inertia

- Listagem de tópicos (+ filtro categoria).
- Formulário criar tópico (categoria, type, title, body).
- Show: body, metadados, lista de posts, form de resposta, botão upvote.
- Estilo: layouts/componentes do starter (shadcn/Tailwind); sem redesign completo.

### Seed

- Admin demo (credenciais documentadas só em docs de setup / domain — **não** secrets em produção; `.env` local).
- ≥ 8 tópicos distribuídos pelas 5 categorias (types variados).

### Documentação (Fase 2)

- Expandir `docs/domain.md` (entidades e regras).
- `docs/api.md` (rotas web/Inertia, não API JSON REST).
- Changelog + README.

### Critérios de aceite (Fase 2)

1. `php artisan migrate --seed` em banco local limpo.
2. Guest lê; escrita/voto exigem login.
3. Toggle de voto mantém `votes_count` coerente.

## Fora de escopo

- Docker / deploy VPS.
- Reverb, NEWS_*, chat realtime.
- Módulos extras além de `type` + categoria para materiais/propostas.
- Expor 2FA/passkeys na UI de login.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Conflito de nomes Inertia `Auth/` vs `auth/` | Atualizar Fortify views + `app.tsx` layout map; remover ou redirecionar páginas antigas |
| `verified` no dashboard antigo | `/forum` público para leitura; escrita só `auth` (sem exigir email verified nesta fase) |
| N+1 na show | Eager load obrigatório no controller show |
| Race em votos | Transaction + unique constraint |

## Ordem de implementação

1. Fase 1: deps frontend, páginas Auth, fortify.home, smoke auth, docs auth.
2. Fase 2: migrations → models/policies/requests → controllers/rotas → UI → seed → docs → verificação `migrate --seed` + votos.
