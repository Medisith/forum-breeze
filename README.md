# Fórum Sustentável

Fórum (TCC) sobre **sustentabilidade**, **meio ambiente** e **desenvolvimento social**.

Stack local: Laravel 13, Inertia + React + TypeScript, Vite, Tailwind CSS v4, MySQL 8 e Redis — todos **nativos na máquina**. Desenvolvimento **não usa Docker**.

## Changelog

- **2026-08-21** — [Home com notícias](docs/changelog/2026-08-21-home-news.md): 3 RSS Agência Brasil nas seções da home, The Guardian no painel **International News**, leitura interna em `/news/{id}`, cache Redis 45 min. Ver [docs/news-sources.md](docs/news-sources.md).
- **2026-08-21** — [Fórum Fase 2](docs/changelog/2026-08-21-forum-domain.md): entidades do fórum (categorias, tópicos, posts, votos), leitura pública / escrita autenticada, toggle de voto, seed demo e rotas Inertia documentadas em `domain.md` e `api.md`.
- **2026-08-21** — [Auth Fase 1](docs/changelog/2026-08-21-auth.md): documentação de register/login/logout (bcrypt, sessão, remember me, rate limit), smoke auth em setup e teste de hash no cadastro.
- **2026-08-21** — [Bootstrap local](docs/changelog/2026-08-21-bootstrap.md): scaffold Laravel + Inertia/React/TS, MySQL e Redis nativos, documentação sem Docker.

## Pré-requisitos (local, sem Docker)

Instale na máquina (Windows):

| Ferramenta | Versão mínima | Notas |
| --- | --- | --- |
| PHP | 8.3+ | Extensões: `pdo_mysql`, `redis`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `bcmath` |
| Composer | 2.x | [getcomposer.org](https://getcomposer.org/) |
| Node.js | 22+ (LTS) | Inclui `npm` |
| MySQL | 8.x | Serviço local em `127.0.0.1:3306` |
| Redis | 7+ | Serviço local em `127.0.0.1:6379` (Redis oficial, fork Windows, ou Memurai) |

Guia de instalação no Windows: [docs/setup.md](docs/setup.md).

**Não use** `docker compose up` nem Laravel Sail neste repositório para desenvolver. Docker Compose entra só na fase de deploy na VPS (`deploy/`).

## Quick start

Com MySQL e Redis **já em execução** em `127.0.0.1`:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Crie o banco (uma vez), se ainda não existir:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e "CREATE DATABASE IF NOT EXISTS forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Ajuste `DB_PASSWORD` no `.env` se o usuário `root` tiver senha. Depois:

```powershell
php artisan migrate
npm install
```

Em **dois terminais**:

```powershell
php artisan serve
```

```powershell
npm run dev
```

Abra [http://localhost:8000](http://localhost:8000).

- **Home:** notícias BR (RSS) + International News (Guardian, se houver key).
- **Fórum:** `/forum` — leitura pública; comentar/criar/votar exige login.
- **Auth:** `/login`, `/register`.

Ative o worker de fila quando for usar jobs (fases posteriores):

```powershell
php artisan queue:work
```

## Variáveis de ambiente

Secrets ficam **somente** em `.env` (não versionado). O contrato está em `.env.example`.

| Grupo | Uso |
| --- | --- |
| `APP_*` | Nome, URL (`http://localhost:8000`), locale `pt_BR` |
| `DB_*` | MySQL em `127.0.0.1:3306`, database `forum` |
| `REDIS_HOST=127.0.0.1` | Redis local; `REDIS_CLIENT=phpredis` |
| `SESSION_DRIVER=redis` | Sessão no Redis |
| `CACHE_STORE=redis` | Cache no Redis (inclui agregação de notícias) |
| `QUEUE_CONNECTION=redis` | Fila no Redis |
| `GUARDIAN_API_KEY` | The Guardian Open Platform — painel International News ([cadastro](https://open-platform.theguardian.com/access/)) |
| `REVERB_*` | Comentados; fase posterior |

## Documentação

- [docs/README.md](docs/README.md) — índice
- [docs/setup.md](docs/setup.md) — MySQL e Redis no Windows (sem Docker)
- [docs/news-sources.md](docs/news-sources.md) — RSS + Guardian + `/news/{id}`
- [docs/api.md](docs/api.md) — rotas
- [docs/domain.md](docs/domain.md) — regras de auth e fórum
- [docs/changelog/](docs/changelog/) — histórico de mudanças
- [deploy/](deploy/) — reservado para a VPS (fase de deploy)

## Testes

Os testes de aplicação usam SQLite em memória (`phpunit.xml`), independentes do MySQL local:

```powershell
php artisan test
```
