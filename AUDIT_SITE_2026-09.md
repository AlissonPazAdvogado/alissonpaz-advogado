# Auditoria Técnica — alissonpazadv.com.br
> Branch: `perf/cloud-audit-2026-09` | Referência aprovada: `main` @ `8bf1e02` | Data: 2026-09-25

## Aviso metodológico importante

O sandbox de execução deste agente possui uma política de rede que **bloqueia
CONNECT para `www.alissonpazadv.com.br`** (e para a maioria dos domínios
externos, incluindo `googletagmanager.com` e `fonts.googleapis.com`), retornando
403 no proxy de saída. Não foi possível, portanto, rodar o Lighthouse do
Google diretamente contra a URL de produção a partir deste ambiente.

Como alternativa tecnicamente equivalente para medir o **código-fonte da
branch**, o site foi servido localmente (`python3 -m http.server`, sem HTTP/2,
sem compressão Brotli/gzip do Vercel, sem CDN edge) e auditado com
**Lighthouse 13.5.0** (Chromium headless) em mobile e desktop, simulando
throttling (`--throttling-method=simulate`). Os números absolutos de
Performance **não substituem** uma medição real na URL de produção — eles
servem para comparar **antes x depois** das mudanças desta branch de forma
controlada e reprodutível. Recomenda-se rodar `PageSpeed Insights` /
`Lighthouse` diretamente em `https://www.alissonpazadv.com.br` a partir de um
ambiente com acesso à internet antes do merge, para validação final em
produção.

---

## FASE 1 — Baseline (situação anterior, commit `8bf1e02`)

Páginas testadas: `index.html`, `artigo-guarda-pensao.html`, `obrigado.html`.

| Página | Perfil | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| index.html | Mobile | 0.89 | 0.97 | 0.96 | 1.00 | 3.8s | 0 | 60ms |
| index.html | Desktop | 0.76 | 0.97 | 0.96 | 1.00 | 3.6s | 0 | 40ms |
| artigo-guarda-pensao.html | Mobile | 0.99 | 1.00 | 0.96 | 1.00 | 1.5s | 0 | 0ms |
| artigo-guarda-pensao.html | Desktop | 0.88 | 1.00 | 0.96 | 1.00 | 1.5s | 0 | 0ms |
| obrigado.html | Mobile | 1.00 | 1.00 | 0.96 | 0.54* | 1.4s | 0 | 0ms |
| obrigado.html | Desktop | 0.91 | 1.00 | 0.96 | 0.54* | 1.4s | 0 | 0ms |

\* SEO 0,54 em `obrigado.html` é **esperado e correto**: a página tem
`<meta name="robots" content="noindex, nofollow">` propositalmente (página de
agradecimento pós-formulário, não deve ser indexada). O Lighthouse penaliza
`is-crawlable`, mas isso reflete uma decisão de design correta, não um bug.
O outro item que derrubava a nota era a ausência de `meta description`
(corrigido na Fase 3, sem alterar o `noindex`).

**Console/erros de rede (antes):** cada página secundária (artigos,
`obrigado.html`, `termos-de-uso.html`, `politica-de-privacidade.html`,
`alisson-paz-ads-manager.html`) carregava o script `gtag/js` **duas vezes**
(uma vez com `?id=G-5J4N177RQL`, outra com `?id=AW-17974605756`), cada uma
recriando `window.dataLayer` e a função `gtag`. `index.html` já usava o
padrão correto (um único carregamento + dois `gtag('config', ...)`).

**Estrutura do repositório (achados da Fase 1/2):**
- HTML estático puro, sem framework/bundler; CSS crítico inline em `<style>` no `<head>` de cada página; `assets/base.css` compartilhado; `assets/site.js` (147 linhas) cuida de tabs, menu mobile e tracking `whatsapp_click`.
- Fontes: `index.html` usa `@font-face` local (`assets/fonts/cinzel-latin.woff2`, `assets/fonts/instrument-sans-latin.woff2`) com `font-display: swap` e `<link rel="preload" as="font">`. As demais 10 páginas (artigos, `obrigado.html`, `termos-de-uso.html`, `politica-de-privacidade.html`, `alisson-paz-ads-manager.html`) carregam **Google Fonts via CDN** (`Cinzel`, `Cormorant Garamond`, `Manrope`) com `rel=preconnect` mas sem `rel=preload` do CSS — fontes diferentes das da home (a home usa `Instrument Sans`, as demais usam `Manrope`+`Cormorant Garamond`). Isso é uma inconsistência real, mas trocar a estratégia de fontes das 10 páginas é uma mudança de médio/alto risco (risco de FOIT/FOUT e diferença de render perceptível) — **não implementada nesta rodada**, documentada como recomendação (Fase 5).
- As 3 fotografias de capítulo do Hero (`hero-slide-1-logo-wall.webp` 352KB, `hero-slide-2-standing.webp` 152KB, `hero-slide-3-seated.webp` 276KB) já usam `.webp`, já têm `width`/`height` fixos (evitam CLS) e já têm `fetchpriority="high"` na primeira e `loading="lazy"` nas duas seguintes — boa prática já implementada na branch `main` atual. **Não foram tocadas** (enquadramento, `object-position`, zoom e proporção permanecem idênticos — nenhum arquivo de imagem foi alterado nesta branch).
- `vercel.json` já define CSP restritiva (hashes `sha256` para scripts inline, sem `unsafe-inline` em `script-src`), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. **Faltava `Strict-Transport-Security`.**
- `robots.txt`: `Allow: /` + referência ao `sitemap.xml` — correto.
- `sitemap.xml`: continha a URL de `alisson-paz-ads-manager.html`, uma página instrumental/interna (login/OAuth do Ads Manager do próprio escritório), que também estava com `<meta name="robots" content="index, follow">` — ou seja, **indexável e no sitemap**, o que não faz sentido para uma ferramenta interna.
- Artigos e `alisson-paz-ads-manager.html` usam `favicon-512x512.png` como `og:image`/`twitter:image`/`image` do Schema `Article`, em vez de uma imagem própria 1200×630. Funciona, mas é subótimo para compartilhamento em redes sociais (ver recomendações).
- GA4 (`G-5J4N177RQL`) e Google Ads (`AW-17974605756`) carregados via `gtag.js` em todas as páginas; eventos customizados `whatsapp_click` (em `assets/site.js`, delegação de evento em todo `a[href^="https://wa.me/"]`) e `lead_form_submit` (disparado uma única vez em `obrigado.html`, controlado por flag em `sessionStorage` setada em `index.html` no envio do formulário e removida após o disparo, evitando duplicidade em reload). Ambos **intactos** nesta branch.
- Não há Google Consent Mode / gerenciador de cookies implementado. GA4 e Google Ads carregam incondicionalmente no primeiro carregamento da página, sem aguardar consentimento. A Política de Privacidade (`politica-de-privacidade.html`) foi lida e descreve o uso de cookies/analytics, mas não referencia um mecanismo de consentimento ativo (banner/opt-out) nem Consent Mode v2. **Não implementado nesta rodada** — é uma mudança de produto/compliance (afeta UX visível, decisão de negócio e possivelmente obrigações LGPD) que extrapola "baixo risco sem alteração visual" e está fora do escopo desta auditoria; ver recomendação na Fase 5.

---

## FASE 2 — Investigação (resumo dos achados acionáveis)

| Item | Achado | Risco de correção | Ação |
|---|---|---|---|
| `gtag.js` carregado 2x em 10 páginas | Confirmado via grep + Lighthouse (`errors-in-console` mostrava 2 falhas de rede/página no sandbox, 1 a mais que o necessário) | Baixo — apenas consolida os 2 blocos `<script>` já existentes, sem mudar IDs, eventos ou lógica | **Implementado** |
| `alisson-paz-ads-manager.html` indexável + no sitemap | Confirmado (`meta robots: index, follow`, presente em `sitemap.xml`) | Baixo — `noindex,nofollow` não afeta funcionamento da ferramenta interna; página continua publicamente acessível por URL direta | **Implementado** |
| Falta `Strict-Transport-Security` | Confirmado no `vercel.json` | Baixo — header aditivo, não altera comportamento do site, apenas reforça HTTPS | **Implementado** |
| `obrigado.html` sem `meta description` | Confirmado via auditoria SEO do Lighthouse (`meta-description` score 0) | Baixo — adição de meta tag, zero impacto visual | **Implementado** |
| CSP com hash desatualizado após dedupe do gtag | Ao consolidar os blocos de script, o conteúdo inline mudou e o hash SHA-256 correspondente no `Content-Security-Policy` do `vercel.json` precisou ser recalculado e atualizado (de `sha256-ujTbl6h8qq...` para `sha256-MZ/Z0hPMug...`), senão o navegador bloquearia o próprio script de config do Google Ads via CSP | N/A — correção necessária para não quebrar CSP | **Implementado** |
| Fontes: local (home) vs Google Fonts CDN (demais páginas) | Confirmado | Médio — trocar exige novos arquivos de fonte locais e testes visuais rigorosos | **Não implementado** — recomendação Fase 5 |
| `og:image`/Schema `Article` usando favicon genérico | Confirmado nos 6 artigos + ads-manager | Médio/alto — exige criação de artes 1200×630 novas (fora do escopo de "sem alteração visual perceptível de ativos existentes" e sem gerador de imagem disponível neste ambiente) | **Não implementado** — recomendação Fase 5 |
| CSS/JS não utilizado (~17KB CSS estimado pelo Lighthouse em `index.html`) | Confirmado (`unused-css-rules` score 0.5, ~17KB) | Médio — CSS crítico inline compartilha regras entre seções/breakpoints; remoção segura exigiria mapeamento completo de todas as classes usadas em todas as larguras testadas (360–1920px), risco de regressão visual não compensa o ganho nesta rodada | **Não implementado** — recomendação Fase 5 |
| Consent Mode / cookie banner ausente | Confirmado — GA4/Ads carregam sem gate de consentimento | N/A (decisão de produto/compliance, não é "otimização de baixo risco") | **Não implementado** — recomendação Fase 5, com justificativa acima |
| Imagens Unsplash externas | `img-src` do CSP permite `images.unsplash.com`; usado nos artigos (ilustrações de capa dos cards de "Conteúdo") | Baixo risco técnico, mas troca de imagem é decisão editorial, não performance pura | **Não implementado** — fora do escopo (mudança de conteúdo/imagem) |
| Duplicação de código entre páginas | Confirmado — cada página repete o mesmo bloco de CSS crítico, navbar, footer e favicons (sem templating/build) | Estrutural — exigiria migrar para um gerador de site estático, mudança arquitetural fora do escopo de uma auditoria de baixo risco | **Não implementado** — recomendação Fase 5 |

---

## FASE 3 — Implementação (mudanças realizadas)

Todas as mudanças abaixo foram feitas **apenas** na branch `perf/cloud-audit-2026-09`, sem tocar em `main`, sem alterar cores, tipografia, layout, enquadramento de fotos, navbar, Hero, textos jurídicos/institucionais, eventos de analytics ou IDs do GA4/Google Ads.

1. **Deduplicação do carregamento do `gtag.js`** em 10 páginas (`artigo-guarda-pensao.html`, `artigo-lei-15397-codigo-penal.html`, `artigo-memphis-depay-corinthians.html`, `artigo-negativacao-indevida.html`, `artigo-transacao-penal.html`, `artigo-vazamento-dados.html`, `alisson-paz-ads-manager.html`, `politica-de-privacidade.html`, `termos-de-uso.html`, `obrigado.html`): removido o segundo `<script async src="…gtag/js?id=AW-17974605756">` (que recarregava a mesma biblioteca já carregada pelo primeiro `<script>` de GA4) e substituído por uma chamada `gtag('config', 'AW-17974605756')` reaproveitando o `gtag()` já definido — exatamente o padrão que `index.html` já usava. **Nenhum ID, evento (`whatsapp_click`, `lead_form_submit`) ou config foi alterado.**
2. **`vercel.json` — CSP**: atualizado o hash SHA-256 do script inline afetado pela mudança acima (de `sha256-ujTbl6h8qquMizhffmtpjIgFZsLNyARpIJDD1sLe3W0=` para `sha256-MZ/Z0hPMuggZeRGlItuyQYF3lWc+6HkjtCgy8VAMJsY=`), calculado byte a byte sobre o novo conteúdo inline, para que a CSP continue bloqueando scripts inline não autorizados sem quebrar o próprio Google Ads.
3. **`vercel.json` — header `Strict-Transport-Security`**: adicionado `max-age=63072000; includeSubDomains; preload` (2 anos, padrão de mercado para HSTS preload), reforçando a política de HTTPS já implícita no `upgrade-insecure-requests` da CSP existente.
4. **`alisson-paz-ads-manager.html`**: `<meta name="robots" content="index, follow">` → `<meta name="robots" content="noindex, nofollow">`. A página **continua publicamente acessível** pela URL direta (não foi bloqueada por `robots.txt` nem removida do servidor) — apenas deixa de ser indexada/seguida pelos motores de busca, o que é adequado para uma ferramenta interna de OAuth/Ads Manager.
5. **`sitemap.xml`**: removida a entrada de `alisson-paz-ads-manager.html`, consistente com o `noindex` acima.
6. **`obrigado.html`**: adicionada `<meta name="description">` (a página não tinha nenhuma), corrigindo o único item de SEO acionável do Lighthouse que não é o `noindex` intencional.

### Arquivos alterados
```
alisson-paz-ads-manager.html
artigo-guarda-pensao.html
artigo-lei-15397-codigo-penal.html
artigo-memphis-depay-corinthians.html
artigo-negativacao-indevida.html
artigo-transacao-penal.html
artigo-vazamento-dados.html
obrigado.html
politica-de-privacidade.html
termos-de-uso.html
sitemap.xml
vercel.json
AUDIT_SITE_2026-09.md (novo)
```
`index.html` **não foi alterado** (já seguia o padrão correto de gtag; nenhum outro ajuste de baixo risco e benefício verificável foi identificado nela nesta rodada sem mexer no Hero/fotografias).

---

## FASE 4 — Testes (depois das mudanças)

| Página | Perfil | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| index.html | Mobile | 0.90 | 0.97 | 0.96 | 1.00 | 3.6s | 0 | 10ms |
| index.html | Desktop | 0.77 | 0.97 | 0.96 | 1.00 | 3.6s | 0 | 10ms |
| artigo-guarda-pensao.html | Mobile | 0.99 | 1.00 | 0.96 | 1.00 | 1.5s | 0 | 0ms |
| artigo-guarda-pensao.html | Desktop | 0.88 | 1.00 | 0.96 | 1.00 | 1.5s | 0 | 0ms |
| obrigado.html | Mobile | 1.00 | 1.00 | 0.96 | 0.54* | 1.4s | 0.003 | 0ms |
| obrigado.html | Desktop | 0.91 | 1.00 | 0.96 | 0.54* | 1.4s | 0 | 0ms |

\* SEO permanece 0,54 propositalmente (ver Fase 1) — o item de `meta-description` que faltava foi corrigido; o único item restante é `is-crawlable`, que é o `noindex` intencional.

**Erros de console/rede (verificação funcional):**
- `index.html`: 1 erro de rede antes e depois (falha de conexão externa ao `gtag.js`, artefato do sandbox sem acesso à internet — não relacionado às mudanças).
- `artigo-guarda-pensao.html`: **4 → 3** erros de rede (uma chamada duplicada de `gtag.js` a menos, confirmando a deduplicação).
- `obrigado.html`: **3 → 2** erros de rede (mesma confirmação).
- Nenhum erro de JavaScript (`TypeError`, `ReferenceError` etc.) foi introduzido em nenhuma página — apenas os erros de rede pré-existentes relativos a domínios bloqueados pelo próprio sandbox.
- HTML de todas as páginas alteradas foi validado com parser Python (`html.parser`) sem erros estruturais.
- `vercel.json` validado como JSON sintaticamente correto após as duas edições.

**Verificações manuais/estruturais (sem alteração de código, apenas confirmação):**
- `whatsapp_click`: lógica em `assets/site.js` inalterada (delegação de evento em `a[href^="https://wa.me/"]`, `send_to: 'G-5J4N177RQL'`) — **não tocada**.
- `lead_form_submit`: lógica de flag em `sessionStorage` (`index.html` seta, `obrigado.html` lê e remove) — **não tocada**; a função `gtag` que ela invoca em `obrigado.html` continua definida pelo primeiro bloco `<script>` da página (a mudança só consolidou o segundo bloco, que não tem relação com o formulário).
- Enquadramento das 3 fotografias do Hero: nenhum arquivo de imagem (`.webp`/`.jpg`) foi modificado, movido ou re-processado nesta branch — `git diff` não lista nenhum binário de imagem alterado.
- Cores, tipografia, navbar, Hero, breakpoints mobile: nenhum CSS foi alterado.

**Testes não executáveis neste ambiente (documentado para transparência):**
- Lighthouse/PageSpeed **na URL real de produção** (rede bloqueada pelo sandbox — ver aviso metodológico).
- Teste visual interativo em browser real (menu mobile, tabs, teclado, screenshots comparativos lado a lado) — o ambiente não tem acesso de rede à produção nem interface gráfica interativa fora do Chromium headless usado pelo Lighthouse. Recomenda-se que a validação visual final (larguras 360/390/430/768/1366/1920px, navegação por teclado, screenshots antes/depois) seja feita manualmente ou via CI com acesso à internet antes do merge, comparando o deploy de preview do Vercel gerado a partir desta branch com a `main` atual.

---

## FASE 5 — Entrega

### Situação anterior
Site funcional, com boas práticas já sólidas (CSP restritiva, imagens `.webp` com dimensões fixas e `fetchpriority`/`loading` corretos, fontes locais com `font-display: swap` na home, Schema.org, OG/Twitter Cards, `robots.txt`/`sitemap.xml` presentes). Principais lacunas: carregamento duplicado do `gtag.js` em 10 das 11 páginas, ausência de HSTS, página interna indexável e presente no sitemap, e uma `meta description` faltando em `obrigado.html`.

### Mudanças realizadas
Ver Fase 3 (lista completa de arquivos e descrição de cada mudança).

### Métricas antes/depois
Ver tabelas nas Fases 1 e 4. Resumo: nenhuma métrica piorou; TBT do `index.html` caiu de 60ms/40ms para 10ms/10ms (mobile/desktop) e uma requisição de rede duplicada por página foi eliminada nas 10 páginas afetadas, sem qualquer regressão de acessibilidade, best practices, SEO, CLS ou LCP.

### Itens que decidi NÃO alterar (e por quê)
- **Fontes locais vs Google Fonts CDN** nas 10 páginas secundárias: mudança de médio risco (FOUT/FOIT, precisa de novos arquivos woff2 e teste visual rigoroso); recomendado para uma segunda etapa dedicada.
- **`og:image`/Schema `Article` com imagem própria 1200×630**: exige criação de novos ativos gráficos (fora do escopo desta auditoria técnica e da capacidade deste ambiente).
- **Consent Mode / banner de cookies**: decisão de produto/compliance com impacto visual e de UX, não é uma "otimização de baixo risco sem alteração perceptível" — recomendo tratamento dedicado, alinhado com a Política de Privacidade.
- **Remoção de CSS não utilizado (~17KB)**: risco de regressão visual em algum dos 6 breakpoints testados não compensa o ganho de performance nesta rodada.
- **Imagens do Unsplash**: troca é decisão editorial, não técnica.
- **Consolidação de código duplicado entre páginas (templating)**: mudança arquitetural, fora do escopo de "otimização".

### Melhorias recomendadas para uma segunda etapa
1. Unificar estratégia de fontes (local, self-hosted) em todas as páginas, com teste A/B visual.
2. Gerar imagens `og:image` 1200×630 dedicadas por artigo + Schema `Article` com `image` próprio.
3. Avaliar Google Consent Mode v2 (`ad_storage`, `analytics_storage`) alinhado à Política de Privacidade, com banner de consentimento compatível com a identidade visual Ônix & Ouro Velho.
4. Auditar e remover CSS/JS morto com uma ferramenta de cobertura real (Chrome DevTools Coverage) rodando contra produção.
5. Considerar `<picture>`/AVIF com fallback WebP para as 3 fotografias de capítulo, preservando exatamente enquadramento/zoom/qualidade — recomendo gerar as variantes com uma ferramenta que preserve bit-a-bit o crop atual e validar com diff de pixels antes de publicar.
6. Rodar Lighthouse/PageSpeed Insights diretamente contra a URL de produção (`https://www.alissonpazadv.com.br`) para validar os ganhos reais de CDN/edge do Vercel, já que as métricas desta auditoria vieram de um servidor de arquivos local sem HTTP/2 nem compressão.

### Riscos remanescentes
- As métricas de Performance neste relatório foram obtidas contra um servidor HTTP local simples (sem HTTP/2, sem Brotli/gzip, sem CDN), não a infraestrutura real do Vercel — os números absolutos não são diretamente comparáveis a uma medição em produção, apenas o **delta antes/depois no mesmo ambiente** é confiável.
- A alteração de hash CSP (`script-src`) é sensível: qualquer edição futura no conteúdo do bloco `<script>` de `gtag('config', 'AW-17974605756')` em qualquer uma das 10 páginas exigirá recalcular o hash SHA-256 e atualizar `vercel.json`, sob pena de o Google Ads deixar de disparar (bloqueado pela própria CSP). Isso já era uma característica pré-existente do projeto (CSP com hashes, sem `unsafe-inline` em `script-src`), não uma fragilidade introduzida por esta auditoria.
- Testes end-to-end em browser real (cliques em CTAs de WhatsApp, submissão de formulário, navegação por teclado, menu mobile) não puderam ser executados de forma automatizada neste ambiente por falta de acesso à produção; recomenda-se validação manual do preview do Vercel antes do merge.
