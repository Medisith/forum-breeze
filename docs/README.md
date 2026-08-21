# Documentação

Índice da documentação deste repositório. O desenvolvimento local **não usa Docker**.

## Domínio e rotas

- [domain.md](domain.md) — regras de negócio: auth (Fase 1) e fórum (Fase 2).
- [api.md](api.md) — tabela de rotas web/Inertia (home, notícias, fórum, auth).
- [news-sources.md](news-sources.md) — RSS brasileiros, Guardian, cache e página `/news/{id}`.

## Ambiente e operação

- [setup.md](setup.md) — PHP, Composer, Node, MySQL 8 e Redis nativos no Windows.
- [../README.md](../README.md) — pré-requisitos e quick start.
- [../.env.example](../.env.example) — contrato de variáveis (sem secrets reais).

## Histórico

- [changelog/2026-08-21-home-news.md](changelog/2026-08-21-home-news.md) — Home com RSS + Guardian e leitura interna.
- [changelog/2026-08-21-forum-domain.md](changelog/2026-08-21-forum-domain.md) — Fase 2: domínio do fórum.
- [changelog/2026-08-21-auth.md](changelog/2026-08-21-auth.md) — Fase 1: autenticação Fortify.
- [changelog/2026-08-21-bootstrap.md](changelog/2026-08-21-bootstrap.md) — Fase 0: bootstrap local.

## Deploy

- [../deploy/README.md](../deploy/README.md) — pasta reservada para Docker na VPS. Não usar em desenvolvimento.

## Convenção de changelog

Toda mudança relevante deve:

1. Criar `docs/changelog/YYYY-MM-DD-slug.md`
2. Incluir entrada no topo de `## Changelog` no `README.md`
3. Atualizar os docs afetados
