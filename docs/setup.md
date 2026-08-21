# Setup local (Windows, sem Docker)

Este projeto roda com PHP, Composer, Node, MySQL e Redis **instalados nativamente**. Não use Docker, Docker Compose nem Laravel Sail na máquina de desenvolvimento.

## PHP 8.3+

1. Instale PHP 8.3 ou superior (WinGet, [windows.php.net](https://windows.php.net/download/), ou Laravel Herd).
2. Confirme: `php -v`
3. Em `php.ini`, habilite pelo menos:

```ini
extension=pdo_mysql
extension=redis
extension=mbstring
extension=openssl
extension=tokenizer
extension=fileinfo
```

`redis` é a extensão **PhpRedis** (DLL `php_redis`). Sem ela, `REDIS_CLIENT=phpredis` falha.

4. Composer 2: `composer -V`

## Node.js

Instale Node 22 LTS. Confirme: `node -v` e `npm -v`.

## MySQL 8 (serviço local)

Não use MariaDB do XAMPP como alvo deste projeto: o critério de aceite é **MySQL 8** em `127.0.0.1:3306`.

### Instalar

```powershell
winget install Oracle.MySQL
```

Binários típicos: `C:\Program Files\MySQL\MySQL Server 8.4\bin\`.

### Se o instalador não criou o serviço Windows

O MySQL Configurator (`mysql_configurator.exe`) exige elevação (Administrador). Alternativa para desenvolvimento local: inicializar um datadir no perfil do usuário e subir o `mysqld` como processo.

1. Crie `C:\Users\<voce>\AppData\Local\MySQL\my.ini`:

```ini
[mysqld]
basedir=C:/Program Files/MySQL/MySQL Server 8.4
datadir=C:/Users/<voce>/AppData/Local/MySQL/Data
port=3306
bind-address=127.0.0.1
mysqlx=0
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
```

Ajuste `basedir` se a versão do servidor for outra (8.0, 8.4, etc.).

2. Inicialize (uma vez), senha de `root` vazia (`--initialize-insecure`):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="$env:LOCALAPPDATA\MySQL\my.ini" --initialize-insecure
```

3. Inicie o servidor:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="$env:LOCALAPPDATA\MySQL\my.ini"
```

Deixe esse processo aberto (ou registre um serviço Windows como Administrador):

```powershell
# PowerShell elevado
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --defaults-file="$env:LOCALAPPDATA\MySQL\my.ini"
Start-Service MySQL84
```

4. Crie o banco:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e "CREATE DATABASE IF NOT EXISTS forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Se `root` tiver senha, coloque-a em `DB_PASSWORD` no `.env` (nunca no Git).

### Conferir

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e "SELECT VERSION();"
```

Esperado: versão `8.x`.

## Redis (serviço local)

Opções nativas no Windows: **Memurai**, Redis via WSL (sem Docker), ou o pacote WinGet `taizod1024.redis-windows-fork`.

### Instalar (WinGet)

```powershell
winget install taizod1024.redis-windows-fork
```

### Iniciar

```powershell
redis-server --bind 127.0.0.1 --port 6379
```

Se `redis-server` não estiver no PATH, use o executável do pacote WinGet (pasta `Redis-*-Windows-x64-msys2` em `AppData\Local\Microsoft\WinGet\Packages`).

### Conferir

```powershell
redis-cli ping
```

Esperado: `PONG`.

O Laravel usa `REDIS_CLIENT=phpredis`, `SESSION_DRIVER=redis`, `CACHE_STORE=redis` e `QUEUE_CONNECTION=redis`. A aplicação precisa conseguir conectar em `127.0.0.1:6379` ao subir (`php artisan serve`).

## Laravel Herd (opcional)

Herd pode fornecer PHP e um proxy local. Redis e MySQL continuam **serviços separados** (Herd não substitui Redis neste projeto). Não use o fluxo Docker do Herd/Sail.

## App Laravel

Na raiz do repositório:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate
npm install
php artisan serve
```

Em outro terminal: `npm run dev`.

### Migrate ok

`php artisan migrate` deve concluir contra o MySQL local (`forum`), sem erro de conexão.

### Redis ok

`redis-cli ping` → `PONG`, e o `artisan serve` não deve logar falha de conexão Redis (sessão/cache).

## Smoke test — Auth (register / login / logout)

Com `php artisan serve` e `npm run dev` ativos, MySQL e Redis conectados:

1. **Cadastro** — abra [http://localhost:8000/register](http://localhost:8000/register), preencha nome, e-mail e senha (mín. 8 caracteres, conforme regras Fortify). Submit → redirect para `/forum` autenticado.
2. **Logout** — use o fluxo de logout da aplicação (POST `/logout`). Deve voltar à home (`/`) como visitante.
3. **Login** — [http://localhost:8000/login](http://localhost:8000/login) com o mesmo e-mail/senha do cadastro. Opcional: marque **Lembrar de mim** (`remember`). Submit → `/forum`.
4. **Credencial inválida** — senha errada deve exibir erro **genérico** (não indica se o e-mail existe).

Detalhes de domínio: [domain.md](domain.md) (seção Auth).

### Rate limit de login (throttle)

O Fortify aplica **5 tentativas de login por minuto** por par `email|IP` (chave transliterada no `FortifyServiceProvider`). Após exceder, a resposta é **HTTP 429**. Em desenvolvimento, aguarde ~1 minuto ou reinicie o Redis se precisar limpar o contador (`CACHE_STORE=redis`).

Teste automatizado relacionado: `php artisan test --filter=test_users_are_rate_limited`.

## Smoke test — Home e notícias

1. Com Redis e MySQL ativos, abra [http://localhost:8000](http://localhost:8000).
2. As seções brasileiras devem listar itens dos RSS da Agência Brasil (meio ambiente / social).
3. Clique numa notícia → URL `/news/{id}` no **próprio site** (não redireciona direto para a Agência Brasil).
4. Painel **International News**: exige `GUARDIAN_API_KEY` no `.env`. Sem a key, o painel mostra aviso vazio; as RSS BR continuam funcionando.
5. Opcional: `php tools\probe-news.php` e `php tools\probe-news-show.php`.

Detalhes: [news-sources.md](news-sources.md).

## Backup local (manual)

Ainda não há rotina automática. Dump pontual:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP forum > backup-forum.sql
```

Guarde dumps fora do repositório. Restauração e backups agendados entram em fases posteriores / deploy na VPS.

## O que não fazer

- Não rode `docker compose up` para desenvolver.
- Não adicione `docker-compose.yml` na raiz para uso local.
- Não commite `.env`, chaves ou dumps com dados reais.
