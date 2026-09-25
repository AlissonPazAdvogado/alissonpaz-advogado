# Auditoria Técnica — Páginas Secundárias
> Branch: `perf/secondary-pages-2026-09` | Referência aprovada: `main` @ `2c72d64f172556dade8ed7d3eeabc49b565aff49` | Data: 2026-09-25

Escopo: `artigo-guarda-pensao.html`, `artigo-lei-15397-codigo-penal.html`, `artigo-memphis-depay-corinthians.html`, `artigo-negativacao-indevida.html`, `artigo-transacao-penal.html`, `artigo-vazamento-dados.html`, `politica-de-privacidade.html`, `termos-de-uso.html`, `obrigado.html`, `alisson-paz-ads-manager.html`, `assets/base.css`, `assets/site.js`, `assets/fonts/`, `vercel.json`.

`index.html` foi lida apenas como referência e **não foi alterada**.

---

## Aviso metodológico

Como na auditoria anterior, o Lighthouse foi rodado contra um servidor local que replica byte a byte os headers de `vercel.json` (CSP, HSTS etc.), não contra a produção — os números absolutos de Performance não são diretamente comparáveis a uma medição real no Vercel Edge, mas o **delta antes/depois no mesmo ambiente** é confiável e foi a base de decisão desta auditoria.

Uma segunda particularidade deste ambiente foi decisiva para o resultado: o **Chrome headless usado pelo Lighthouse não tem acesso à rede externa** (nem mesmo com `--proxy-server` apontado explicitamente para o proxy do sandbox), ao contrário do `curl` do shell, que acessa `fonts.googleapis.com`/`fonts.gstatic.com` normalmente. Isso significa que, **antes** da mudança, o Lighthouse media as páginas secundárias com o Google Fonts **sempre falhando** (erro de rede), caindo para fonte de fallback do sistema — o que não representa o comportamento real em produção, onde o Google Fonts carrega normalmente para a maioria dos usuários. Depois da migração para self-hosting, essa dependência de rede externa deixou de existir, e o teste local passou a refletir fielmente o que qualquer usuário (inclusive um com Google Fonts bloqueado por rede corporativa, extensão de privacidade, DNS filtrado etc.) vai ver. Este efeito colateral do ambiente de teste acabou expondo um achado real e válido, documentado na Fase 8.

---

## FASE 1 — Baseline

### Inventário de fontes e recursos externos (antes)

Todas as 10 páginas secundárias usavam o mesmo import do Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
```
- Cinzel (400/500/600), Cormorant Garamond (400/500/600 normal + 400 itálico), Manrope (300/400/500/600) — usados para navbar/logo, H1–H4 e corpo de texto, respectivamente.
- `index.html` (referência, não alterada) já usa fontes locais próprias — **Cinzel** e **Instrument Sans** — via `@font-face` inline com `assets/fonts/cinzel-latin.woff2` e `assets/fonts/instrument-sans-latin.woff2`, com `preload`. Ou seja, a família tipográfica de corpo da home (Instrument Sans) é **diferente** da família de corpo das páginas secundárias (Manrope) — isso já era assim antes desta auditoria e **não foi alterado** (mudar a fonte de corpo da home ou das páginas secundárias para uniformizar seria uma mudança visual perceptível, fora do escopo "sem alteração de aparência").
- `assets/fonts/` continha apenas `cinzel-latin.woff2` (25.888 bytes) e `instrument-sans-latin.woff2` (29.904 bytes), ambos exclusivos da home.
- CSS repetido: cada uma das 10 páginas secundárias tem um bloco `<style>` inline praticamente idêntico (variáveis de cor, `.article-hero`, `.sidebar-card`, `.whatsapp-float`, breakpoints) — herdado do mesmo template. `assets/base.css` (339 linhas) já centraliza uma pequena parte (skip-link, foco, nav-toggle) e é linkado pelas 10 páginas secundárias via `<link rel="stylesheet">`; `index.html` replica o equivalente inline (comentário no próprio arquivo: "inlined to avoid a render-blocking request").
- `assets/site.js` (147 linhas) é compartilhado por todas as páginas (menu mobile, tabs, tracking `whatsapp_click`, `IntersectionObserver` para `data-bg`) e não apresentava duplicação a resolver.
- Recursos externos: Google Fonts (10 páginas), imagens do Unsplash (nos cards de artigo — mantidas, fora de escopo), Google Tag Manager/Ads (já deduplicado na auditoria anterior).
- Sem CLS mensurável em nenhuma página testada (todas em 0 ou ~0 no baseline).

### Lighthouse — baseline (antes)

| Página | Perfil | Perf | LCP | FCP | SI | CLS | Requests |
|---|---|---|---|---|---|---|---|
| artigo-guarda-pensao.html | Mobile | 0.98 | 1.6s | 1.5s | 3.8s | 0 | 8 |
| artigo-guarda-pensao.html | Desktop | 0.88 | 1.6s | 1.5s | 1.5s | 0 | 8 |
| politica-de-privacidade.html | Mobile | 0.99 | 1.5s | 1.5s | 2.4s | 0 | 7 |
| politica-de-privacidade.html | Desktop | 0.88 | 1.6s | 1.5s | 1.5s | 0 | 7 |
| obrigado.html | Mobile | 0.99 | 1.5s | 1.5s | 2.4s | 0 | 8 |
| obrigado.html | Desktop | 0.88 | 1.5s | 1.5s | 1.5s | 0 | 8 |

Nas 3 páginas testadas, a única requisição relacionada a fontes era o CSS do Google Fonts — que **falhava** neste ambiente (ver aviso metodológico), então nenhum `.woff2` chegava a ser buscado; o texto renderizava inteiramente com a fonte de fallback do sistema.

---

## FASE 2 — Fontes (achado principal)

### Investigação

Com acesso de rede real (via `curl`, fora do Chrome do Lighthouse — ver aviso metodológico), foi possível baixar exatamente os arquivos que o Google Fonts serve **hoje** para o import usado pelas páginas secundárias, e inspecioná-los com `fontTools`:

| Família | Peso(s) declarado(s) | Arquivo servido pelo Google | Fonte variável? |
|---|---|---|---|
| Cinzel | 400, 500, 600 | `8vIJ7ww63mVu7gt79mT7.woff2` (mesmo arquivo para os 3 pesos) | Sim — eixo `wght` 400–900 |
| Cormorant Garamond (normal) | 400, 500, 600 | `co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2` (mesmo arquivo para os 3 pesos) | Sim — eixo `wght` 300–700 |
| Cormorant Garamond (itálico) | 400 | `co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd58jD-iNM8.woff2` | Estática (só 400 itálico é usado) |
| Manrope | 300, 400, 500, 600 | `xn7gYHE41ni1AdIRggexSg.woff2` (mesmo arquivo para os 4 pesos) | Sim — eixo `wght` 200–800 |

Ou seja: **as 3 famílias usadas nas páginas secundárias são fontes variáveis**, e o Google Fonts já serve o **mesmo arquivo único** por família (exceto o itálico da Cormorant Garamond, que é estático) independentemente do peso declarado — o navegador interpola o peso correto a partir do eixo `wght` do próprio arquivo. Esse é exatamente o mesmo padrão que `index.html` já usa para sua Cinzel local (um único arquivo, reaproveitado em `font-weight: 400/500/600`), confirmado também como fonte variável (`wght` 400–900) via `fontTools`.

**Conclusão da investigação:** é possível reproduzir a tipografia das páginas secundárias com fidelidade total — mesma família, mesmos pesos, mesmo eixo variável, mesmos glifos — baixando e hospedando localmente **os mesmos 4 arquivos** que o Google já serve hoje para este import exato. Não há necessidade de aproximar com uma fonte "parecida": são literalmente os mesmos binários.

### Verificação técnica adicional: `cinzel-latin.woff2` (arquivo da home) vs. arquivo atual do Google

O arquivo `cinzel-latin.woff2` já existente em `assets/fonts/` (usado por `index.html`, página aprovada) tem hash SHA-256 **diferente** do arquivo Cinzel baixado agora de `fonts.gstatic.com` (confirmado em dois downloads separados, hashes idênticos entre si: `09941fb1c169c38fd414536b37690057fc01b3117a5c63dd6571186540c8f370`). Isso, por si só, não prova nem descarta equivalência visual — então foi feita uma comparação técnica completa com `fontTools`, tabela por tabela:

| Verificação | Resultado |
|---|---|
| `cmap` (mapeamento caractere→glifo) | **Idêntico** (220 entradas, comparação completa) |
| Ordem dos glifos (`glyf order`) | **Idêntica** (228 glifos, mesma ordem) |
| Outlines dos glifos (contornos/curvas, via `RecordingPen`, todos os 228 glifos) | **Idênticos** — 0 glifos com outline diferente |
| `hmtx` (advance width + left side bearing) | **Idêntico** para os 228 glifos — 0 diferenças |
| Unidades por em (`unitsPerEm`) | **Idêntico** — 1000 em ambos |
| Ascender/descender (`hhea` e `OS/2.sTypoAscender/Descender`) | **Idêntico** — 976 / -372 em ambos |
| x-height / cap-height (`OS/2.sxHeight/sCapHeight`) | **Idêntico** — 500 / 700 em ambos |
| Eixo `wght` (`fvar`) | **Idêntico** — min 400, default 400, max 900 em ambos |
| Instâncias nomeadas (`fvar.instances`) | **Idênticas** — Regular(400)/Bold(700)/Black(900) em ambos |
| `gvar` (deltas de variação — como cada glifo muda ao longo do eixo `wght`) | **Bytes idênticos** (14.406 bytes, comparação binária direta) |
| `avar`, `HVAR`, `STAT` (tabelas de suporte a fonte variável) | **Bytes idênticos** nos três |
| `GPOS` (kerning/posicionamento) | **Bytes idênticos** (16.088 bytes) |
| `GSUB` (substituição de glifos) | **Bytes idênticos** (114 bytes) |
| `GDEF` (definições de glifo) | **Bytes idênticos** (380 bytes) |
| `post` (ângulo itálico, sublinhado) | **Idêntico** — ângulo 0°, mesmas posições de sublinhado |
| `gasp` (grid-fitting/anti-aliasing) | **Bytes idênticos** |
| Nomes/style linking (`name` table, IDs 1/2/4/6) | **Idênticos** — "Cinzel" / "Regular" / "Cinzel Regular" / "Cinzel-Regular" |
| Tabelas presentes | **Única diferença**: o arquivo do Google tem a tabela `prep` (7 bytes: bytecode TrueType `SCANCTRL(511)` + `SCANTYPE(4)`); o arquivo local **não tem** essa tabela |

A única diferença encontrada, em toda a fonte, é a tabela `prep` — um pequeno programa de hinting TrueType legado que controla como o rasterizador lida com dropout de traços finos em tamanhos de pixel muito pequenos (tipicamente relevante só para renderização GDI clássica no Windows; navegadores modernos, em qualquer sistema operacional, renderizam texto web via seus próprios pipelines de anti-aliasing/hinting e, para fontes variáveis como esta, majoritariamente ignoram ou não dependem de bytecode `prep` para determinar a forma visível do glifo). Como a comparação acima já prova, byte a byte, que os outlines, métricas, kerning e dados de variação são idênticos, essa tabela ausente não altera forma de letra, espaçamento ou layout — mas, seguindo a regra explícita desta auditoria de não presumir equivalência diante de qualquer diferença, **`cinzel-latin.woff2` de `index.html` não foi reaproveitado nem modificado**. Em vez disso, foi criado um arquivo **separado**, `assets/fonts/cinzel-secondary-latin.woff2`, contendo o binário exato hoje servido pelo Google (hash confirmado idêntico), usado **apenas** pelas páginas secundárias. `index.html` continua referenciando somente `cinzel-latin.woff2`, sem nenhuma alteração.

Como confirmação final, prática e não apenas teórica: capturei um screenshot de `artigo-guarda-pensao.html` com `cinzel-latin.woff2` e outro, no mesmo ambiente, após trocar para `cinzel-secondary-latin.woff2` — **os dois arquivos PNG resultantes têm o mesmo hash SHA-256**, ou seja, a troca produziu uma imagem renderizada bit a bit idêntica.

Os outros 3 arquivos (`cormorant-garamond-latin.woff2`, `cormorant-garamond-italic-latin.woff2`, `manrope-latin.woff2`) são novos — baixados agora, sem arquivo local prévio para comparar — então essa questão de equivalência não se aplica a eles.

### Implementação

- Adicionados 4 novos arquivos a `assets/fonts/`: `cinzel-secondary-latin.woff2` (25.904 bytes — binário idêntico ao servido hoje por `fonts.gstatic.com`, ver verificação técnica acima), `cormorant-garamond-latin.woff2` (37.640 bytes), `cormorant-garamond-italic-latin.woff2` (23.660 bytes), `manrope-latin.woff2` (24.836 bytes) — todos baixados diretamente de `fonts.gstatic.com` nas URLs exatas que o import atual referenciava. `assets/fonts/cinzel-latin.woff2` (usado por `index.html`) **não foi tocado nem reaproveitado**.
- Adicionado a `assets/base.css` (arquivo já compartilhado pelas 10 páginas secundárias — nenhum arquivo novo, nenhum build system) um bloco `@font-face` com 4 declarações, usando `font-weight` em **intervalo** (`400 600`, `300 600` etc.) já que são fontes variáveis — forma mais correta e compacta do que repetir um `@font-face` por peso discreto (equivalente em resultado, já que é o mesmo arquivo e o mesmo eixo variável; só reduz duplicação de código):
  ```css
  @font-face { font-family: 'Cinzel'; font-style: normal; font-weight: 400 600; font-display: swap; src: url('fonts/cinzel-secondary-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Cormorant Garamond'; font-style: normal; font-weight: 400 600; font-display: swap; src: url('fonts/cormorant-garamond-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Cormorant Garamond'; font-style: italic; font-weight: 400; font-display: swap; src: url('fonts/cormorant-garamond-italic-latin.woff2') format('woff2'); }
  @font-face { font-family: 'Manrope'; font-style: normal; font-weight: 300 600; font-display: swap; src: url('fonts/manrope-latin.woff2') format('woff2'); }
  ```
- `font-display: swap` mantido (mesma estratégia já usada por `index.html` e pelo Google Fonts anteriormente).
- Nas 10 páginas secundárias, o bloco de 3 linhas do Google Fonts (`preconnect` ×2 + `<link rel="stylesheet">`) foi substituído por 3 `<link rel="preload" as="font" type="font/woff2" ... crossorigin>` apontando para os arquivos locais (`manrope-latin.woff2`, `cormorant-garamond-latin.woff2`, `cinzel-secondary-latin.woff2`) — preload usado porque as 3 famílias (Manrope no corpo, Cormorant Garamond no H1, Cinzel na navbar) são todas usadas **acima da dobra**, mesmo padrão de justificativa que `index.html` já usa para suas próprias fontes.

### Conformidade de licença (SIL OFL 1.1)

Cinzel, Cormorant Garamond e Manrope são redistribuídas neste repositório como arquivos `.woff2` sob a **SIL Open Font License, versão 1.1**. A OFL exige que o Font Software (incluindo cópias redistribuídas, mesmo em formato binário) seja acompanhado do texto integral da licença e dos avisos de copyright originais — o que este repositório ainda não tinha para nenhuma das fontes já hospedadas localmente antes desta auditoria (`cinzel-latin.woff2`, `instrument-sans-latin.woff2`, ambas usadas por `index.html`).

Como correção de conformidade, foram adicionados os textos **oficiais** de licença, copiados sem nenhuma modificação diretamente do repositório upstream `google/fonts` (`ofl/<família>/OFL.txt`, a fonte de verdade dos metadados de licenciamento que o próprio Google Fonts distribui):

```
assets/fonts/licenses/Cinzel-OFL.txt            (Copyright 2020 The Cinzel Project Authors)
assets/fonts/licenses/CormorantGaramond-OFL.txt (Copyright 2015 the Cormorant Project Authors)
assets/fonts/licenses/Manrope-OFL.txt           (Copyright 2018 The Manrope Project Authors)
```

Cada arquivo foi comparado byte a byte (`diff`) contra o download direto do upstream — **idênticos**, nenhuma edição de conteúdo. Nenhum `.woff2` foi alterado; nenhum HTML, CSS, CSP, `preload`, JavaScript, analytics ou aparência do site foi tocado nesta etapa — apenas os 3 arquivos de texto de licença foram adicionados (confirmado por `git status`, que não lista nenhum outro arquivo modificado).

**Observação para uma etapa futura:** `cinzel-latin.woff2` e `instrument-sans-latin.woff2` (usados por `index.html`, fora do escopo desta sessão) também são Font Software sob OFL e igualmente deveriam ter seus avisos de licença redistribuídos junto — recomenda-se adicionar `assets/fonts/licenses/Cinzel-OFL.txt` (já presente, mesma licença/copyright) e um `InstrumentSans-OFL.txt` equivalente em uma próxima sessão que toque a home.
- **Nenhuma declaração `font-family` no CSS de nenhuma página foi alterada** — todas continuam referenciando `'Cinzel'`, `'Cormorant Garamond'`, `'Manrope'` exatamente como antes; só a origem do arquivo físico mudou.
- CSP (`vercel.json`): removidas as entradas `https://fonts.googleapis.com` de `style-src` e `https://fonts.gstatic.com` de `font-src`, já que nenhuma página depende mais desses domínios (confirmado por busca em todo o repositório — nenhuma referência restante). `font-src` passa a ser só `'self'`; `style-src` passa a ser `'self' 'unsafe-inline'` (o `'unsafe-inline'` já existia antes, não foi adicionado nem removido). Nenhum hash de `script-src` foi tocado (nenhum `<script>` inline foi alterado nesta rodada).

### Validação

- **Zero erros de CSP** (`Refused to load`/`Content Security Policy`) em nenhuma das 12 execuções de Lighthouse pós-mudança (mobile+desktop em artigo, política, obrigado — 6 execuções com `cinzel-latin.woff2` reaproveitado, repetidas depois de trocar para `cinzel-secondary-latin.woff2`) — confirma que remover `fonts.googleapis.com`/`fonts.gstatic.com` da CSP não quebrou nada, e que os arquivos locais carregam sob `font-src 'self'` normalmente, com ou sem a troca do arquivo Cinzel.
- Todas as 10 páginas alteradas passaram por validação estrutural de HTML (`html.parser`, sem erros) e `vercel.json` validado como JSON.
- **Comparação visual direta** (screenshot antes/depois, mesma página, mesmo ambiente, via `git stash`): no estado anterior, com o Google Fonts falhando neste sandbox, o H1 e a navbar renderizavam com fonte de fallback do sistema (perceptivelmente diferente — sem serifa elegante no título, sem o letter-spacing da logo); no estado novo, com as fontes locais, H1 renderiza em Cormorant Garamond e a navbar em Cinzel, exatamente como o restante do site (e como a própria home). Capturas adicionais em 390px (mobile) e 1920px (desktop) em `artigo-guarda-pensao.html` e `obrigado.html` confirmam layout, quebra de linha e alinhamento preservados, sem CLS perceptível.
- **Confirmação específica da troca de arquivo Cinzel**: screenshot de `artigo-guarda-pensao.html` (1366px) capturado com `cinzel-latin.woff2` e novamente, no mesmo ambiente, com `cinzel-secondary-latin.woff2` — os dois PNGs resultantes têm **hash SHA-256 idêntico**, confirmando renderização bit a bit igual (ver Fase 2).
- Nenhum FOUT/FOIT problemático identificado: `font-display: swap` está ativo, e como os arquivos agora são de mesma origem (sem round-trip DNS/TLS para um domínio externo), o tempo até o texto usar a fonte final é menor que antes.

---

## FASE 3 — Recursos externos

- **Google Fonts**: eliminado das páginas secundárias (ver Fase 2). `index.html` nunca dependeu dele.
- **Imagens do Unsplash**: usadas nos cards de capa dos artigos (`.article-cover`/`data-bg` via `assets/site.js`, carregamento lazy com `IntersectionObserver`). **Não alteradas** — trocar por hospedagem própria é uma mudança de ativo de imagem, fora do escopo desta rodada (risco de licenciamento/qualidade a avaliar separadamente). Documentado como recomendação futura.
- **Google Tag Manager / Ads**: já deduplicado na auditoria anterior (PR #1); nenhuma mudança nesta rodada.
- Nenhum outro recurso bloqueante externo identificado nas páginas secundárias.

---

## FASE 4 — Cache e headers

Os assets estáticos do projeto (`.woff2`, `.webp`, `.png`, `.jpg`, `.svg`, `.css`, `.js`) são servidos pelo Vercel, que já aplica automaticamente `Cache-Control: public, max-age=0, must-revalidate` com revalidação por `ETag`/`immutable` para arquivos com hash de conteúdo em deployments do tipo "static" — comportamento padrão da plataforma, sem configuração explícita necessária em `vercel.json` para isso funcionar corretamente com HTTP caching condicional (`If-None-Match`).

**Decisão: não adicionar regras de `Cache-Control` de longa duração customizadas nesta rodada.** Motivo: os nomes de arquivo atuais dos assets (`cinzel-latin.woff2`, `manrope-latin.woff2`, `hero-slide-1-logo-wall.webp` etc.) **não são versionados por hash de conteúdo** — se um arquivo for atualizado no futuro mantendo o mesmo nome, um `Cache-Control: max-age` agressivo faria navegadores/CDN servirem a versão antiga por muito tempo, criando exatamente o risco que o usuário pediu para evitar ("NÃO criar risco de usuários receberem versão antiga"). Implementar cache de longa duração com segurança exigiria primeiro adotar nomes de arquivo com hash de conteúdo (fingerprinting), o que é uma mudança de processo/build fora do escopo de "otimização de baixo risco sem alteração visual" desta sessão. Fica como recomendação para uma etapa futura (Fase 11).
`vercel.json` não recebeu nenhuma regra nova de `Cache-Control` — apenas o ajuste de CSP já descrito.

---

## FASE 5 — CSS e código repetido

Confirmada duplicação relevante entre as 10 páginas secundárias: o bloco `<style>` inline (~350–650 linhas por página) é quase idêntico entre elas (variáveis de cor, `.article-hero`, `.sidebar-card`, breakpoints, `.whatsapp-float` etc.), diferindo apenas em pequenos trechos específicos de cada artigo/página.

**Decisão: não consolidar esse CSS nesta rodada.** Motivo: embora o benefício (menos bytes por página, uma única fonte de verdade) seja real, mover ~400 linhas de CSS inline para um arquivo `assets/*.css` compartilhado em 10 páginas de uma vez é uma mudança de superfície grande demais para ser "baixo risco" dentro desta sessão — qualquer pequena divergência entre páginas (que não foi mapeada linha a linha aqui) viraria um bug sutil de layout em produção, e o pedido do usuário explicitamente pede para não introduzir build system nem fazer refatoração arquitetural ampla. A única consolidação feita foi a de `@font-face` em `assets/base.css` (Fase 2), que é aditiva, pequena, e já usa um arquivo compartilhado existente — dentro do critério "benefício mensurável + risco baixo + não complica manutenção".

Recomendação futura: migrar o CSS crítico repetido para `assets/base.css` (ou um novo `assets/article.css` dedicado) em uma sessão própria, com diff página a página cuidadoso antes de remover cada bloco inline.

---

## FASE 6 — Acessibilidade e HTML

Verificado, sem alterar design, nas 10 páginas secundárias:
- **H1**: exatamente 1 por página em todas as 10 (`grep` confirmou).
- **`lang`**: `lang="pt-BR"` em todas as 10.
- **Landmarks/skip-link**: `.skip-link` (definido em `assets/base.css`, compartilhado) presente; `<nav id="navbar">`, `<main>`/conteúdo principal e `<footer>` presentes no template compartilhado.
- **Foco**: `:where(a, button, input, select, textarea):focus-visible` com contorno visível (`outline: 3px solid var(--gold-lt)`) já definido em `assets/base.css`, aplicado a todas as páginas secundárias.
- **`alt`**: nenhuma tag `<img>` sem atributo `alt` encontrada nos arquivos verificados.
- **Meta viewport**: presente e correta (`width=device-width, initial-scale=1.0`) em todas.

Nenhum problema objetivo de acessibilidade foi encontrado que justificasse correção nesta rodada — o template já estava consistente. Nenhuma alteração de acessibilidade foi necessária ou feita.

---

## FASE 7 — SEO técnico

Confirmado (sem alterar textos/títulos):
- **Canonical**: presente e correto em todas as páginas indexáveis, apontando para a URL de produção correspondente.
- **Robots**: artigos e páginas legais com `index, follow`; `obrigado.html` e `alisson-paz-ads-manager.html` com `noindex, nofollow` (definido na auditoria anterior, confirmado intacto).
- **Sitemap**: `alisson-paz-ads-manager.html` confirmada ausente (removida na auditoria anterior); demais páginas secundárias indexáveis presentes.
- **Open Graph / Twitter Card / JSON-LD (`Article`)**: presentes em todos os artigos e em `alisson-paz-ads-manager.html`.
- **Achado (já documentado na auditoria anterior, reconfirmado aqui, não corrigido)**: `artigo-guarda-pensao.html`, `artigo-lei-15397-codigo-penal.html`, `artigo-memphis-depay-corinthians.html`, `artigo-negativacao-indevida.html`, `artigo-transacao-penal.html`, `artigo-vazamento-dados.html` e `alisson-paz-ads-manager.html` usam `favicon-512x512.png` como `og:image`/`twitter:image`/`image` do Schema `Article`, em vez de uma imagem própria 1200×630. **Não corrigido nesta sessão** (instrução explícita do usuário: não criar imagens OG agora) — recomendado para uma etapa futura com Canva, gerando uma arte 1200×630 por artigo.
- Nenhum título, descrição ou data foi reescrito.

---

## FASE 8 — Implementação (resumo consolidado)

| # | Mudança | Problema | Solução | Risco | Arquivos |
|---|---|---|---|---|---|
| 1 | Self-hosting de Cinzel/Cormorant Garamond/Manrope nas páginas secundárias | Dependência de `fonts.googleapis.com`/`fonts.gstatic.com`: 2 origens externas extras, FOUT quando a rede do usuário não alcança o Google Fonts (achado visual real neste próprio ambiente de teste) | Baixar os arquivos `.woff2` exatos hoje servidos pelo Google (mesmas fontes variáveis, mesmos pesos) e declarar `@font-face` em `assets/base.css`, com `preload` local | Baixo — mesmos binários, mesmas declarações `font-family` no CSS de cada página, validado visualmente | `assets/base.css`, `assets/fonts/*.woff2` (3 novos), 10 páginas secundárias |
| 2 | Enxugamento da CSP (`style-src`, `font-src`) | Diretivas permitindo `fonts.googleapis.com`/`fonts.gstatic.com` ficaram órfãs após (1) | Remover as duas entradas, já que nenhuma página as usa mais | Baixo — validado com 0 erros de CSP em 6 execuções de Lighthouse pós-mudança | `vercel.json` |

Todas as mudanças passaram no critério das 5 condições simultâneas exigidas (benefício comprovável, risco baixo, zero alteração visual perceptível, medição antes/depois, reversível com `git revert`).

**Nenhuma mudança piorou Performance, CLS, LCP relevante, acessibilidade ou aparência** — ver métricas na Fase 9. Nenhuma alteração foi revertida.

---

## FASE 9 — Testes (depois das alterações)

### Lighthouse — depois

Números finais, medidos com o arquivo definitivo `cinzel-secondary-latin.woff2` (a rodada anterior, com `cinzel-latin.woff2` reaproveitado, tinha números praticamente idênticos — ver Fase 2, confirmação por screenshot com hash igual):

| Página | Perfil | Perf | LCP | FCP | SI | CLS | Requests |
|---|---|---|---|---|---|---|---|
| artigo-guarda-pensao.html | Mobile | 1.00 (antes 0.98) | 1.8s (antes 1.6s) | 0.9s (antes 1.5s) | 0.9s (antes 3.8s) | 0 | 10 (antes 8) |
| artigo-guarda-pensao.html | Desktop | 0.91 (antes 0.88) | 1.8s (antes 1.6s) | 0.9s (antes 1.5s) | 0.9s (antes 1.5s) | 0 | 10 (antes 8) |
| politica-de-privacidade.html | Mobile | 1.00 (antes 0.99) | 1.8s (antes 1.5s) | 0.9s (antes 1.5s) | 0.9s (antes 2.4s) | 0 | 9 (antes 7) |
| politica-de-privacidade.html | Desktop | 0.90 (antes 0.88) | 1.8s (antes 1.6s) | 1.1s (antes 1.5s) | 1.1s (antes 1.5s) | 0 | 9 (antes 7) |
| obrigado.html | Mobile | 1.00 (antes 0.99) | 1.7s (antes 1.5s) | 0.9s (antes 1.5s) | 0.9s (antes 2.4s) | 0.003 | 10 (antes 8) |
| obrigado.html | Desktop | 0.90 (antes 0.88) | 1.8s (antes 1.5s) | 1.1s (antes 1.5s) | 1.1s (antes 1.5s) | 0 | 10 (antes 8) |

**Leitura honesta dos números — os deltas de FCP/SI abaixo NÃO representam ganho de produção.** O baseline "antes" foi medido com o Google Fonts **inacessível** para o Chrome do Lighthouse neste sandbox (ver aviso metodológico: falha de rede confirmada, 100% das tentativas, para `fonts.googleapis.com`/`fonts.gstatic.com` especificamente no processo Chrome, ainda que o mesmo host fosse alcançável via `curl` no shell). Ou seja, a página "antes" nunca chegou a buscar nenhum `.woff2` — ficou presa esperando um CSS externo que sempre falhava, e a melhora de ~40% em FCP/SI medida aqui reflete, em grande parte, a **eliminação dessa espera por um recurso que já estava quebrado neste ambiente de teste**, não necessariamente o ganho que um usuário real teria trocando um Google Fonts funcional por self-hosting. Em produção, onde o Google Fonts carrega normalmente para a maioria dos usuários, o ganho esperado de self-hosting é tipicamente mais modesto (elimina 1–2 round-trips de DNS/TLS/CDN externos, mas não uma falha total de carregamento) — a magnitude real só pode ser confirmada com um teste contra o Preview/produção. O LCP aparenta uma leve piora (+0.1–0.3s) pelo motivo inverso: agora o elemento de LCP espera 3 arquivos de fonte locais carregarem antes do "swap" final, algo que antes nunca acontecia aqui (a fonte de fallback já "era" o conteúdo do LCP, já que a busca externa nunca completava). Isso também não deve se repetir em produção real: lá, substituir Google Fonts funcional por arquivos same-origin tende a **igualar ou melhorar** o LCP, nunca piorar — mas, novamente, isso só pode ser confirmado com um teste real em produção/preview (ver Fase 11, limitação). Requests subiram de 7–8 para 9–10 porque agora 3 arquivos de fonte realmente chegam a ser buscados com sucesso (antes, zero — a única requisição de fonte, o CSS do Google, falhava).

Best Practices, Accessibility e SEO permaneceram estáveis (nenhuma categoria piorou).

### Testes visuais

- Screenshot comparativo antes/depois (mesmo commit exceto pelas mudanças desta sessão, via `git stash`) em `artigo-guarda-pensao.html` 1366px: confirma tipografia correta (Cinzel na navbar, Cormorant Garamond no H1, Manrope no corpo) depois da mudança, versus fallback do sistema antes (no ambiente de teste onde o Google Fonts falha).
- Screenshots adicionais em 390px (mobile) e 1920px (desktop, `obrigado.html`) depois da mudança: layout, quebra de linha, alinhamento e cores preservados; nenhuma diferença perceptível de tipografia entre viewports.
- Não foi possível capturar as larguras 430/768 nesta rodada por limite de tempo da sessão — as larguras testadas (390, 1366, 1920) cobrem mobile, desktop pequeno e desktop grande, e o CSS responsivo das páginas secundárias não foi tocado em nenhum ponto (apenas `<head>` e `assets/base.css`/`vercel.json`), então o risco residual nas larguras não testadas é considerado baixo.

### Analytics e CSP (Fase 10)

- `gtag.js` confirmado carregando **exatamente 1 vez** por página em todas as páginas verificadas (`artigo-guarda-pensao.html`, `politica-de-privacidade.html`, `obrigado.html`, `alisson-paz-ads-manager.html`) — comportamento herdado da auditoria anterior, não afetado por esta.
- `gtag('config', 'G-5J4N177RQL')` e `gtag('config', 'AW-17974605756')` confirmados presentes e inalterados.
- `data-conversion="whatsapp-cta"` confirmado presente (6 ocorrências em `index.html`, 2 em `obrigado.html`, nenhuma tocada).
- Flag `lead_form_submitted` (gravação em `index.html`, leitura/remoção em `obrigado.html`) confirmada byte a byte inalterada.
- **Zero erros de CSP** em todas as execuções pós-mudança (nenhum "Refused to execute/load", nenhuma menção a "Content Security Policy" nos consoles capturados).
- Nenhum novo erro de console introduzido — os únicos erros remanescentes são falhas de rede para domínios externos (`googletagmanager.com`, `images.unsplash.com`) bloqueados pela política de rede deste sandbox para o processo Chrome, presentes igualmente antes e depois, sem relação com esta mudança.

---

## FASE 11 — Entrega

### Arquivos modificados
```
assets/base.css                        (novo bloco @font-face)
assets/fonts/cinzel-secondary-latin.woff2           (novo arquivo — NÃO é assets/fonts/cinzel-latin.woff2, que continua exclusivo de index.html)
assets/fonts/cormorant-garamond-latin.woff2         (novo arquivo)
assets/fonts/cormorant-garamond-italic-latin.woff2  (novo arquivo)
assets/fonts/manrope-latin.woff2                    (novo arquivo)
assets/fonts/licenses/Cinzel-OFL.txt                (novo — texto oficial da licença, sem edição)
assets/fonts/licenses/CormorantGaramond-OFL.txt     (novo — texto oficial da licença, sem edição)
assets/fonts/licenses/Manrope-OFL.txt               (novo — texto oficial da licença, sem edição)
vercel.json                            (CSP: remove fonts.googleapis.com / fonts.gstatic.com)
artigo-guarda-pensao.html              (Google Fonts → preload local)
artigo-lei-15397-codigo-penal.html     (Google Fonts → preload local)
artigo-memphis-depay-corinthians.html  (Google Fonts → preload local)
artigo-negativacao-indevida.html       (Google Fonts → preload local)
artigo-transacao-penal.html            (Google Fonts → preload local)
artigo-vazamento-dados.html            (Google Fonts → preload local)
politica-de-privacidade.html           (Google Fonts → preload local)
termos-de-uso.html                     (Google Fonts → preload local)
obrigado.html                          (Google Fonts → preload local)
alisson-paz-ads-manager.html           (Google Fonts → preload local)
AUDIT_SECONDARY_PAGES_2026-09.md       (novo)
```
`index.html` **não foi alterada**.

### Alterações rejeitadas e motivo
1. **Consolidar o CSS inline repetido das 10 páginas em um arquivo compartilhado** — benefício real, mas superfície de risco grande demais para "baixo risco" sem mapeamento linha a linha de cada página; fora do escopo desta sessão (sem build system, sem refatoração ampla).
2. **`Cache-Control` de longa duração customizado para assets estáticos** — inseguro sem fingerprinting de nome de arquivo; risco de servir versão antiga após uma futura atualização de asset. Vercel já aplica caching condicional razoável por padrão.
3. **Imagens OG próprias (1200×630) para os 7 artigos que usam favicon genérico** — instrução explícita do usuário para não criar essas imagens nesta sessão; documentado para etapa futura com Canva.
4. **Hospedar localmente as imagens do Unsplash usadas nos cards de artigo** — troca de ativo de imagem, fora do escopo de "otimização técnica sem alteração visual"; requer avaliação de licenciamento/qualidade separada.
5. **Uniformizar a fonte de corpo entre home (Instrument Sans) e páginas secundárias (Manrope)** — mudaria a aparência aprovada da home; fora de escopo.

### Métricas antes/depois
Ver tabelas nas Fases 1 e 9. Resumo: FCP e Speed Index caíram ~40% nas 3 páginas testadas neste ambiente local — mas esse número **não deve ser lido como o ganho esperado em produção**, porque o baseline "antes" tinha o Google Fonts inacessível para o Chrome de teste (ver leitura honesta na Fase 9); é um indicador de que a mudança funciona e remove uma dependência externa, não uma previsão de melhoria real de produção. Performance (score 0–1 do Lighthouse) subiu em todas as 6 combinações testadas; CLS permaneceu ~0; nenhuma categoria (Accessibility, Best Practices, SEO) piorou; zero erros de CSP em nenhuma execução, antes ou depois da correção do arquivo Cinzel.

### Riscos remanescentes
- LCP mostrou uma leve alta local (+0.1–0.3s) neste ambiente sintético pelo motivo explicado na Fase 9 — recomenda-se confirmar em produção/preview real antes do merge que o LCP não piorou (deve manter-se igual ou melhorar, já que se trata de trocar uma origem externa por same-origin).
- As larguras 430px e 768px não foram capturadas em screenshot nesta rodada (ver Fase 9); o risco residual é considerado baixo porque nenhum CSS responsivo foi tocado.
- A consolidação de CSS duplicado entre as 10 páginas secundárias permanece como dívida técnica documentada, não implementada.
- Cache de longa duração para assets estáticos permanece como recomendação futura, condicionada a adotar nomes de arquivo com hash de conteúdo.

### Recomendações futuras
1. Migrar o CSS crítico inline repetido das 10 páginas secundárias para um arquivo compartilhado, com diff cuidadoso página a página.
2. Adotar fingerprinting de nome de arquivo para assets estáticos e então aplicar `Cache-Control: public, max-age=31536000, immutable`.
3. Gerar imagens `og:image`/Schema `Article` 1200×630 próprias para os 7 artigos que hoje usam o favicon genérico (com Canva).
4. Avaliar hospedar localmente as imagens do Unsplash usadas nos cards de artigo, após validação de licenciamento e qualidade.
5. Confirmar em produção real (após merge) que o LCP das páginas secundárias não piorou, usando PageSpeed Insights/Lighthouse contra a URL pública.

---

## Confirmação de escopo

- Hero da home, as três fotografias principais, seu enquadramento/zoom/`object-position`, navbar da home, cores, paleta, identidade visual, textos jurídicos/institucionais, telefone, endereço, OAB e URLs de WhatsApp: **nenhum tocado**.
- `index.html` e `assets/fonts/cinzel-latin.woff2` (arquivo de fonte que ela usa): **nenhum byte alterado** — confirmado por `git diff index.html` vazio e pelo arquivo de fonte não ter sido sobrescrito nem reaproveitado (ver Fase 2, verificação técnica com `fontTools`).
- GA4 (`G-5J4N177RQL`) e Google Ads (`AW-17974605756`): IDs intactos.
- Eventos `whatsapp_click` e `lead_form_submit`: código-fonte intacto, comportamento confirmado.
- Formulário e fluxo `index.html → WhatsApp → obrigado.html`: código-fonte intacto (nenhuma linha tocada).
- CSP: apenas enxugada (removidas 2 diretivas de host que ficaram órfãs); nenhum hash de `script-src` alterado; `unsafe-inline` não foi adicionado em lugar nenhum.
- Nenhum Google Consent Mode ou banner de cookies foi implementado.
- Nenhuma página jurídica ou de marketing nova foi criada.
- Nenhum conteúdo de artigo foi alterado.
- Nenhuma campanha do Google Ads foi tocada.

---

## FASE 12 — Validação manual final (usuário)

O usuário validou manualmente o Preview real (commit `989222f`) e confirmou:

- Preview visualmente idêntico à produção;
- tipografia preservada (Cinzel/Cormorant Garamond/Manrope, mesma família/peso/espaçamento em todas as páginas secundárias);
- títulos, corpo, navbar e espaçamentos sem regressão perceptível;
- `obrigado.html` também validada manualmente.

Conferência técnica final antes do merge (nesta sessão): `base` = `main`, `main` confirmada em `2c72d64f172556dade8ed7d3eeabc49b565aff49`, `head` do PR = `989222f6d5b45e947f7488f38050c55bbd0aa8fc` (exatamente 3 commits na branch, todos já auditados — nenhuma mudança nova entrou depois da validação), `mergeable_state: clean` (sem conflitos), deployment da Vercel para o commit `989222f` em estado `READY`, e `git diff origin/main -- index.html` / `git diff origin/main -- assets/fonts/cinzel-latin.woff2` ambos vazios (home e seu arquivo de fonte permanecem intocados).

**VALIDAÇÃO TÉCNICA E MANUAL CONCLUÍDAS — nenhuma regressão identificada. PR aprovado para merge.**
