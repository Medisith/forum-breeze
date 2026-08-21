# 2026-08-21 — Fórum (Fase 2)

## O que mudou

Domínio do fórum implementado e documentado:

- **Schema** — tabelas `categories`, `topics`, `posts`, `votes` (migration `2026_08_21_100000_create_forum_tables`).
- **Seed** — `CategorySeeder` (5 categorias) + `ForumDemoSeeder` (admin demo, ≥ 10 tópicos, posts).
- **Rotas/UI** — listagem, detalhe, criar tópico, responder e votar (Inertia/React).
- **Regras** — leitura pública; escrita e voto exigem `auth`; toggle de voto em transação DB.
- **`docs/domain.md`** — entidades, enum `TopicType`, leitura/escrita, voto, seed local.
- **`docs/api.md`** — tabela de rotas web/Inertia com middleware.

## Como validar

1. `php artisan migrate:fresh --seed --force` → categorias, admin e tópicos no MySQL.
2. `php artisan test` → inclui `Tests\Feature\Forum\TopicTest` (guest GET forum, guest POST topic → login, vote toggle).
3. Smoke manual:
   - Guest: `GET /forum` → 200.
   - Guest: `POST /forum/topics` → redirect login.
   - Login: votar duas vezes no mesmo tópico → `votes_count` alterna 1 e 0.
4. Seed local: login `admin@forum.test` / `password` (não usar em produção).
