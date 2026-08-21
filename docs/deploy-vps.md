# Deploy VPS (sem Docker) — /pei2

## URL

| Página | URL |
| --- | --- |
| Home | `https://technologyhm.com.br/pei2` |
| Fórum | `https://technologyhm.com.br/pei2/forum` |
| Login | `https://technologyhm.com.br/pei2/login` |
| Notícia | `https://technologyhm.com.br/pei2/news/{id}` |

Prefixo configurável: `APP_PATH_PREFIX=pei2` + `APP_URL=https://technologyhm.com.br/pei2`.

## Servidor

- Código: `/opt/forum` (clone de `forum-breeze`)
- Nginx: `location ^~ /pei2` no server HTTPS de `technologyhm.com.br` (arquivo `sites-enabled/pfl`)
- PHP-FPM 8.3, MySQL local, Redis local — **sem Docker**

## Deploy / atualização

```bash
cd /opt/forum
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan wayfinder:generate --with-form --no-interaction
npm ci
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link || true
sudo nginx -t && sudo systemctl reload nginx
```

`.env` de produção (não versionado) deve conter `APP_PATH_PREFIX`, `APP_URL`, `ASSET_URL`, `SESSION_PATH=/pei2`, DB, Redis e `GUARDIAN_API_KEY` se houver.
