# 2026-08-21 — Bootstrap local

## O que mudou

Scaffold inicial do Fórum TCC (sustentabilidade, meio ambiente e desenvolvimento social):

- Laravel 13 + Fortify, Inertia 3, React 19, TypeScript, Vite e Tailwind CSS v4 (starter kit oficial React, equivalente ao Breeze).
- MySQL 8 e Redis nativos em `127.0.0.1` (`SESSION_DRIVER`, `CACHE_STORE` e `QUEUE_CONNECTION` no Redis).
- `.env.example` com `APP_*`, `DB_*`, Redis e placeholders comentados `REVERB_*` / `NEWS_*`.
- Documentação de setup Windows **sem Docker**. Pasta `deploy/` reservada para a VPS.
- Laravel Sail removido para não induzir fluxo Docker local.

## Como validar

1. MySQL 8 escutando em `127.0.0.1:3306`; banco `forum` criado.
2. `php artisan migrate` conclui sem erro.
3. `redis-cli ping` retorna `PONG`.
4. `php artisan serve` sobe sem erro de Redis.
5. `npm run dev` + abrir `http://localhost:8000` renderiza a página Inertia "Fórum Sustentável".
