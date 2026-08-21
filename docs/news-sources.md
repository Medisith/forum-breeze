# Fontes de notícias

A home agrega **3 RSS brasileiros** (Agência Brasil) e **1 API internacional** (The Guardian). O browser **não** chama essas fontes: o backend busca, normaliza, coloca em cache e a UI consome o resultado via Inertia.

## Fontes

| Tipo | Key interna | URL / endpoint | Onde aparece na home |
| --- | --- | --- | --- |
| RSS | `agencia-brasil-meio-ambiente` | `https://agenciabrasil.ebc.com.br/rss/meio-ambiente/feed.xml` | Stats, métricas, card “Meio ambiente”, aba/tabela Meio ambiente |
| RSS | `agencia-brasil-direitos-humanos` | `https://agenciabrasil.ebc.com.br/rss/direitos-humanos/feed.xml` | Stats, métricas, card “Desenvolvimento social”, aba/tabela Social |
| RSS | `agencia-brasil-ultimas` | `https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml` | Contagem “Últimas” + fallback das tabelas |
| API | `guardian-environment` | Guardian Content API `section=environment` | Painel **International News** |

Cadastro da key Guardian (grátis): [open-platform.theguardian.com/access](https://open-platform.theguardian.com/access/)

Variável: `GUARDIAN_API_KEY` em `.env` (ver `.env.example` e `config/services.php`).

## Arquitetura

```
RssFeedSource / GuardianEnvironmentSource
        ↓
  NewsAggregator::forHome()
        ↓
  Cache Redis (TTL 45 min) + catálogo por id
        ↓
  HomeController → props `feed` → welcome.tsx
```

- **Falha parcial:** se uma fonte falhar, as outras seguem; erros vão em `sources_failed`.
- **Leitura interna:** links da home apontam para `GET /news/{id}` (`News/ShowPage`). O corpo completo da matéria original raramente vem no RSS — a página mostra título + resumo e botão “Abrir na fonte original”.
- **Catálogo:** `home.news.catalog.v2` guarda artigos por id (sha1) para a rota de detalhe.

## Código

| Peça | Caminho |
| --- | --- |
| Contrato | `app/Services/News/Contracts/NewsSource.php` |
| RSS | `app/Services/News/Sources/RssFeedSource.php` |
| Guardian | `app/Services/News/Sources/GuardianEnvironmentSource.php` |
| Agregador | `app/Services/News/NewsAggregator.php` |
| Home | `app/Http/Controllers/HomeController.php` |
| Detalhe | `app/Http/Controllers/NewsController.php` |
| UI home | `resources/js/components/home/*`, `resources/js/pages/welcome.tsx` |
| UI artigo | `resources/js/pages/News/ShowPage.tsx` |

## Operação local

```powershell
# opcional: limpar cache após mudar fontes
php artisan cache:clear

# smoke das fontes (sem HTTP do Vite)
php tools\probe-news.php
php tools\probe-news-show.php
```

Sem `GUARDIAN_API_KEY`, as 3 RSS continuam populando as seções brasileiras; o painel internacional fica vazio com aviso na UI.
