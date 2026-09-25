# Auditoria — Google Ads, GA4 e Rastreamento do Site
> Branch: `analytics/ads-ga4-audit-2026-09` | Referência: `main` @ `dedbab637de4d8948036f3a240938e1de3c8dd01` | Data: 2026-09-25

**Regra desta sessão: read-only para Google Ads e GA4.** Nenhuma campanha, grupo de anúncios, palavra-chave, orçamento, lance, público, conversão ou configuração de propriedade foi criada, pausada, ativada, editada ou excluída. Nenhuma palavra-chave negativa foi adicionada.

---

## FASE INICIAL — O que realmente está disponível

Esta sessão tem acesso à ferramenta **Windsor.ai** (conector MCP), que já vinha **conectada e habilitada** neste chat (`installState: connected`, `enabledInChat: true`) — não fui eu quem autenticou nada nesta sessão.

Consultando o próprio Windsor.ai (`get_connectors`), as contas conectadas são:

| Conector | Conta |
|---|---|
| `google_ads` | conta Google Ads do escritório |
| `googleanalytics4` | propriedade GA4 do escritório |

O nome retornado por `get_connectors` para cada conta/propriedade confirma que são as contas corretas do escritório (não há ambiguidade de conta) — os identificadores numéricos e o nome exato não são reproduzidos neste relatório por serem identificadores de conta.

### Tentativa de leitura de dados reais — bloqueada pelo plano do Windsor.ai

Ao chamar `get_data` (Google Ads — desempenho de campanha, últimos 30 dias; termos de pesquisa, últimos 90 dias; GA4 — sessões, últimos 7 dias), **toda consulta que incluía um campo de texto (campanha, termo de pesquisa, data com dimensão)** retornou, no lugar do dado, a seguinte mensagem literal do próprio Windsor.ai:

> "Uh-oh! These are not your real numbers: reads are paused because you have 2 accounts connected and your Free plan includes 1 account. To resume, disconnect 1 account at https://onboard.windsor.ai/app/ or upgrade at https://onboard.windsor.ai/app/pricing"

Junto com essa mensagem, **todos os campos numéricos da mesma resposta vinham zerados** (custo, cliques, impressões, conversões = 0). Testei em seguida uma consulta só com campos numéricos, sem nenhum campo de texto (`date` + `cost`, sem dimensão de campanha) — ela retornou `cost: 0` **sem** a mensagem de aviso. Isso não prova um gasto real de R$0: como o padrão já confirmado é "leitura pausada → aviso + zeros", e o aviso só aparece quando algum campo de texto está presente na resposta, um `0` isolado em uma consulta puramente numérica é indistinguível de um zero real. Portanto, **nenhum número obtido do Windsor.ai nesta sessão é tratado como dado real** — nem os explicitamente marcados com o aviso, nem os "zeros silenciosos".

**Conclusão factual, sem ambiguidade:**

> **Dados reais do Google Ads/GA4 não estão acessíveis nesta Cloud Session** — não por falta de autenticação (a conexão existe e aponta para as contas corretas), mas porque o plano gratuito do Windsor.ai permite ler apenas 1 conta por vez, e há 2 contas conectadas (Google Ads + GA4) simultaneamente, então a plataforma pausou as leituras de ambas.

Isso está fora do meu controle nesta sessão: resolver exigiria você desconectar uma das duas contas (perdendo a outra) ou fazer upgrade do plano do Windsor.ai — uma decisão e uma ação de conta que não me cabe tomar sozinho. Não tentei nenhuma outra via de acesso (não há Google Ads API / GA4 Data API oficial nem outro MCP disponível nesta sessão além do Windsor.ai).

**Todas as seções abaixo que dependeriam de dados reais de Ads/GA4 (gasto, cliques, termos de pesquisa, funil real, discrepâncias Ads×GA4) ficam, portanto, marcadas explicitamente como "sem dado real disponível" — nenhum número foi estimado ou inventado para preenchê-las.**

---

## Auditoria do código de tracking

Arquivos lidos integralmente: `index.html` (bloco do formulário e footer), `obrigado.html` (completo), `assets/site.js` (completo), `alisson-paz-ads-manager.html` (head + corpo), `vercel.json` (CSP completa), e os `<head>` de todas as páginas secundárias (herdados das duas auditorias anteriores, reconfirmados aqui quanto a duplicidade de `gtag.js`).

### Carregamento do gtag.js e inicialização

- **`index.html`**: um único `<script async src=".../gtag/js?id=G-5J4N177RQL">`, seguido de `gtag('config', 'G-5J4N177RQL')` e `gtag('config', 'AW-17974605756')` no mesmo bloco inline.
- **10 páginas secundárias** (`obrigado.html`, 6 artigos, `politica-de-privacidade.html`, `termos-de-uso.html`, `alisson-paz-ads-manager.html`): também um único `<script async>` de `gtag.js` (`id=G-5J4N177RQL`) no `<head>`, com `gtag('config', 'G-5J4N177RQL')` logo em seguida, e um segundo bloco `gtag('config', 'AW-17974605756')` mais abaixo no `<head>`, reaproveitando o `gtag` já definido (sem recarregar a biblioteca) — este é exatamente o padrão consolidado nas duas auditorias anteriores. **Confirmado: `gtag.js` carrega uma única vez por página em todas as páginas verificadas.** Este comportamento não foi tocado nesta sessão.

### `whatsapp_click`

Definido em `assets/site.js` (linhas 26–36):
```js
document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-conversion="whatsapp-cta"]');
  if (!target) return;
  track('whatsapp_click', { send_to: 'G-5J4N177RQL', link_location: target.getAttribute('href') || '' });
}, true);
```
- Delegação de evento no `document`, com `capture: true` — dispara na fase de captura, antes do clique chegar ao link, e é resiliente a `stopPropagation()` em qualquer CTA.
- `track()` só chama `gtag()` se `typeof window.gtag === 'function'` — não lança erro se `gtag.js` ainda não carregou ou foi bloqueado; nesse caso, o evento é **silenciosamente perdido** (não há fila/retry).
- Payload enviado: `{ send_to: 'G-5J4N177RQL', link_location: <href> }`. **`send_to` aponta só para o GA4**, não para `AW-17974605756`. Isso significa que, no código, `whatsapp_click` **não é enviado diretamente como conversão do Google Ads** — só chega ao Ads se houver importação de evento do GA4 configurada do lado da conta do Google Ads (Ads → Conversões → importar do Google Analytics). **Não consegui confirmar se essa importação existe**, porque isso é configuração de conta, não código, e o acesso a dados reais está bloqueado (ver Fase Inicial). Esta é uma pergunta em aberto para verificação manual sua no painel do Google Ads.
- `data-conversion="whatsapp-cta"` está presente em **6 links de WhatsApp em `index.html`** e **2 em `obrigado.html`** — todos confirmados intactos nesta sessão (nenhum arquivo de código foi alterado).

### `lead_form_submit`

Fluxo em duas pontas:
1. **`index.html`** (handler de submit do `#contactForm`, inline, fora de qualquer módulo):
   ```js
   if (!nome || !telefone || !assunto) return;           // valida campos obrigatórios
   sessionStorage.setItem('lead_form_submitted', '1');    // grava flag ANTES de abrir o WhatsApp
   window.open('https://wa.me/...' , '_blank');
   setTimeout(() => { window.location.href = 'obrigado.html'; }, 400);
   ```
2. **`obrigado.html`** (script inline no final do `<body>`):
   ```js
   const submitted = sessionStorage.getItem('lead_form_submitted') === '1';
   if (submitted) {
     sessionStorage.removeItem('lead_form_submitted');     // remove ANTES de disparar
     if (typeof window.gtag === 'function') {
       gtag('event', 'lead_form_submit', { send_to: 'G-5J4N177RQL', form_id: 'contactForm' });
     }
   }
   ```
- Mesma observação do `whatsapp_click`: `send_to` só aponta para o GA4, não para `AW-17974605756` diretamente no código.
- A flag é **removida antes** do disparo do evento — isso é o que impede duplicidade em refresh (na recarga, a flag já não existe mais).

---

## Validação de eventos — riscos avaliados a partir do código real

| Cenário | O que acontece | Risco |
|---|---|---|
| Reload de `obrigado.html` após o primeiro carregamento | Flag já foi removida no primeiro carregamento → `submitted` é `false` → evento não dispara de novo | **Nenhum** — comportamento correto |
| Acesso direto a `obrigado.html` (sem passar pelo formulário) | Flag nunca existiu → `submitted` é `false` → evento não dispara | **Nenhum** — comportamento correto |
| Usuário fecha a aba/janela do WhatsApp sem enviar mensagem | Sem efeito no rastreamento: a flag já foi gravada e o redirecionamento para `obrigado.html` já estava agendado antes de o WhatsApp abrir. `lead_form_submit` dispara mesmo que a mensagem nunca tenha sido enviada de fato no WhatsApp | **Limitação real, não um bug**: o evento mede "usuário preencheu e submeteu o formulário com campos obrigatórios válidos", não "mensagem efetivamente enviada no WhatsApp". Isso é inerente ao desenho atual (WhatsApp não expõe callback de envio para o navegador) — documentado como ponto cego, não corrigido |
| Pop-up bloqueado pelo navegador | `window.open()` é chamado **de forma síncrona dentro do handler de `submit`** (gesto do usuário), o que é justamente o padrão que os navegadores exigem para não bloquear pop-ups. O redirecionamento para `obrigado.html` ocorre via `setTimeout` (400ms) independente do resultado do `window.open()` — `lead_form_submit` dispara de qualquer forma | Baixo, mas existe: se o pop-up for bloqueado mesmo assim (extensões agressivas), o lead é contado no GA4 sem que o WhatsApp tenha realmente aberto. Mesma natureza do ponto acima |
| Bloqueadores de anúncio/privacidade (uBlock Origin, Brave, navegadores com "protection" agressiva) | `googletagmanager.com` é um dos domínios mais comumente bloqueados por esse tipo de ferramenta. Quando bloqueado, `gtag.js` nunca carrega, `window.gtag` nunca é definido, e **tanto `whatsapp_click` quanto `lead_form_submit` são perdidos silenciosamente** (o código checa `typeof window.gtag === 'function'` e simplesmente não faz nada se for `false`) | **Ponto cego real e não pequeno** — não há fallback (ex.: beacon direto para uma API própria, Measurement Protocol server-side) para esses casos. Não implementado nesta sessão (mudaria a arquitetura de rastreamento) — ver recomendações |
| CSP bloqueando o script | `script-src` inclui `https://www.googletagmanager.com` e `https://googleads.g.doubleclick.net`; `connect-src` inclui os domínios de beacon do GA4/Ads (`google-analytics.com`, `googletagmanager.com`, `googleadservices.com`, `doubleclick.net`). CSP **não é a causa** de nenhuma perda de evento hoje — está corretamente configurada para permitir esses domínios | **Nenhum** |
| Evento disparado antes de `gtag()` estar pronto | O padrão `window.dataLayer = window.dataLayer \|\| []; function gtag(){dataLayer.push(arguments);}` define `gtag` **imediatamente**, de forma síncrona, antes mesmo do script externo `gtag.js` carregar — chamadas a `gtag()` são só enfileiradas em `dataLayer` e processadas assim que a biblioteca carrega. Não há perda por timing nesse ponto | **Nenhum** |
| Duplicidade por dupla contagem | Não identifiquei nenhum caminho de código em que `whatsapp_click` ou `lead_form_submit` disparem duas vezes para uma mesma ação do usuário | **Nenhum identificado no código** |
| Desktop vs. mobile | O código não distingue os dois — mesma lógica de `window.open`/`sessionStorage`/eventos. A diferença real é de comportamento do navegador/SO ao processar `wa.me` (abrir o app nativo do WhatsApp vs. `web.whatsapp.com`), fora do controle deste código | Comportamental, não um bug de rastreamento |
| Discrepância GA4 × Google Ads | Não pude verificar com dado real (ver Fase Inicial). No código, ambos os eventos só endereçam `G-5J4N177RQL` — a conversão só chega ao Ads se houver importação de conversão do GA4 configurada na conta do Ads. **Verificação manual recomendada**: Google Ads → Conversões → conferir se existem ações de conversão do tipo "Importado do Google Analytics 4" para `whatsapp_click` e `lead_form_submit`, e se estão marcadas como "principal" | Não verificável nesta sessão |

**Nenhum bug de rastreamento foi encontrado que justificasse uma correção de código nesta sessão.** Os pontos acima são limitações estruturais/pontos cegos do desenho atual, não erros de implementação — por isso, seguindo a regra da sessão, **nenhuma alteração de código foi feita**.

---

## Funil observável hoje

```
Google Ads impressão → clique → sessão/landing page → interação → whatsapp_click OU formulário → lead_form_submit
```

| Etapa | Consigo observar? | Como |
|---|---|---|
| Impressão do anúncio | Só via Google Ads (dado real bloqueado nesta sessão) | — |
| Clique no anúncio | Só via Google Ads (dado real bloqueado nesta sessão) | — |
| Sessão/landing page no site | Só via GA4 (dado real bloqueado nesta sessão) | — |
| Interação com a página (scroll, tabs de #atuacao) | Não instrumentado como evento GA4 hoje (apenas `whatsapp_click`/`lead_form_submit` são eventos customizados) | Ponto cego: não há evento de "chegou em #atuacao" ou "abriu uma tab" |
| Clique no WhatsApp | Sim, via código (`whatsapp_click`) | Confirmado no código; volume real não verificável nesta sessão |
| Envio do formulário | Sim, via código (`lead_form_submit`), com a ressalva de que mede submissão válida, não confirmação de entrega no WhatsApp | Confirmado no código |
| Conversa real no WhatsApp | **Não observável e não deve ser** — o prompt desta auditoria proibiu explicitamente qualquer tentativa de rastrear conteúdo privado do WhatsApp ou usar fingerprinting; nenhuma tentativa foi feita | Fora de escopo por design, corretamente |

**Ponto cego mais relevante:** hoje não é possível, só pelo código, saber se um usuário que clicou em um anúncio pago (1) chegou à seção de áreas de atuação, (2) qual área especificamente, antes de decidir clicar no WhatsApp ou preencher o formulário. Isso exigiria eventos GA4 adicionais (ex.: `scroll` automático do GA4 já cobre parte disso, mas não há evento customizado de "visualizou #atuacao > Penal").

---

## Auditoria de `alisson-paz-ads-manager.html`

Lido integralmente. Achados:

- **O que a página realmente é**: uma página **estática e puramente informativa** (sem `<form>`, sem `<input>`, sem `fetch()`, sem qualquer chamada de API, sem `client_id`/`access_token` no código). O texto do próprio corpo da página descreve a finalidade: "ferramenta de uso interno... para administrar exclusivamente as próprias campanhas publicitárias do escritório... utiliza a Google Ads API... mediante autenticação OAuth do titular da conta". **Esta página no repositório parece funcionar como a página pública/informativa relacionada ao aplicativo e ao processo de verificação OAuth do Google** — o texto do próprio corpo descreve exatamente esse papel, e esse tipo de página costuma ser solicitado pelo Google como parte da verificação de apps com escopos sensíveis, mas não confirmei nesta sessão os requisitos exatos do processo de verificação nem se esta página específica foi de fato submetida/aprovada nesse fluxo — não é a aplicação Ads Manager em si, que deve rodar em outro lugar (backend próprio, fora deste repositório estático).
- **Segurança**: não há nenhum segredo, token ou endpoint de API exposto nesta página — correto e seguro como está.
- **SEO/indexação**: `noindex, nofollow`, fora do `sitemap.xml` — confirmado consistente com as auditorias anteriores, sem regressão.
- **Autenticação/arquitetura OAuth**: como a página não contém a aplicação real, não há nada a avaliar tecnicamente sobre o fluxo OAuth em si a partir deste repositório — a aplicação de verdade (se existir e estiver rodando) está fora do escopo visível aqui.
- **Utilidade real hoje**: parece cumprir a função de página de divulgação pública do app, associada ao processo de verificação OAuth do Google (não confirmado com certeza nesta sessão). Não é, hoje, um painel funcional de leitura — não há UI de dados nesta página.
- **O que falta para virar um painel read-only útil**: ver seção de arquitetura recomendada abaixo. Em resumo, precisaria de um backend próprio (fora do repositório estático do site) que guarde o `refresh_token` em um cofre de segredos, exponha só endpoints de leitura, e sirva os dados para uma UI — nunca client secret/refresh token no HTML/JS servido ao navegador.

**Nenhuma alteração foi feita nesta página.**

---

## Arquitetura recomendada para monitoramento diário (proposta, não implementada)

Objetivo do usuário: acompanhar Google Ads + GA4 diariamente sem login manual, com uso possível por ChatGPT/Claude, read-only por padrão.

### Opções tecnicamente viáveis

> **Nota de proveniência desta subseção**: os itens 1 e 2 abaixo incorporam uma informação que **não verifiquei eu mesmo nesta sessão** — o usuário informou, na revisão deste relatório, que existe um MCP oficial `googleads/google-ads-mcp` já operacional no ambiente local dele; ele simplesmente não estava disponível/instalado nesta Cloud Session (busquei por ferramentas com esse perfil nesta sessão e não encontrei nenhuma). Registro isso como informação do usuário, não como fato que eu tenha confirmado por mim mesmo — a distinção importa porque o restante deste relatório segue a regra de nunca misturar dado real com estimativa.

1. **`googleads/google-ads-mcp` (MCP oficial para Google Ads) + GA4 Data API oficial (read-only) — recomendação primária**
   - Segundo informação do usuário, o `google-ads-mcp` já está configurado e operacional no ambiente local dele — bastaria disponibilizá-lo/habilitá-lo em uma Cloud Session para uso aqui. Isso resolve, para o lado do Google Ads, tanto o problema de dependência de terceiro quanto o limite de "1 conta por plano" que bloqueou esta sessão (era uma limitação do Windsor.ai, não do Google Ads).
   - Para o GA4, não há indicação de um MCP oficial equivalente já configurado — a via recomendada é implementar acesso direto à **GA4 Data API** em modo somente leitura, usando o escopo OAuth **`https://www.googleapis.com/auth/analytics.readonly`** (correção: este é o escopo correto da Analytics Data API — não `analyticsdata.readonly`, que não é um nome de escopo válido do Google).
   - Contras: a parte de GA4 ainda exige um backend pequeno (mesmo que serverless) para guardar o `refresh_token` com segurança e renovar o `access_token`; esforço de implementação nessa ponta.
   - Custo: gratuito (dentro das cotas padrão das APIs).

2. **Windsor.ai — opção secundária, não solução prioritária**
   - Prós: já está conectado, já mapeia campos, zero código adicional.
   - Contras: **já demonstrou nesta própria auditoria** a limitação de "1 conta por plano Free" — um upgrade pago resolveria isso, mas mantém uma dependência de terceiro com acesso às duas contas (Ads + GA4) e custo recorrente, quando a rota oficial (item 1) já cobre o lado do Google Ads sem esse custo. Faz sentido como opção secundária/backup, ou para conectores que não têm MCP oficial equivalente — não como base principal do monitoramento diário, dado que a rota oficial já está disponível para Ads.

### Antes de qualquer envio de conversão direto ao Google Ads

Ao desenhar a integração oficial acima, **não implementar envio de evento diretamente para `AW-17974605756`** (via Measurement Protocol, API de conversões offline, ou qualquer outro caminho que grave uma conversão nova na conta de Ads) sem antes verificar, no próprio Google Ads (Conversões), quais ações de conversão já existem e se `whatsapp_click`/`lead_form_submit` já chegam lá via importação do GA4 (ver seção "Validação de eventos" acima — isso não foi confirmado nesta sessão por falta de acesso a dado real). Implementar um segundo caminho de envio para a mesma conversão, sem primeiro confirmar isso, criaria risco real de **dupla contagem** de leads/conversões no Ads. Este é um item de verificação manual antes de qualquer implementação, não uma tarefa executada nesta sessão.

### Modelo de acesso do Google Ads API vigente (desde 09/09/2026)

O modelo de nível de acesso do Google Ads API mudou nessa data e é relevante para qualquer implementação futura:

- **Developer tokens deixaram de ser o mecanismo determinante do nível de acesso** (não são mais o que define se a integração tem acesso "test/basic/standard").
- **O nível de acesso agora é associado ao Google Cloud Project** que gera as credenciais OAuth usadas na integração — é no GCP Project, não mais no developer token isoladamente, que o nível de acesso é avaliado/concedido.
- **O OAuth scope continua sendo `https://www.googleapis.com/auth/adwords`** — não muda com essa atualização.
- **Não existe scope OAuth separado de somente leitura no Google Ads API.** O mesmo scope `adwords` cobre leitura e escrita; a API não oferece um scope `adwords.readonly` ou equivalente.
- **Para monitoramento estritamente somente leitura**, a forma correta de impor a restrição não é por scope OAuth (que não existe nesse formato), e sim por **role da conta**: usar um usuário/service account com **role `READ_ONLY`** na conta do Google Ads, e limitar a integração, no código, a chamar apenas métodos de consulta (`GoogleAdsService.Search`/`SearchStream`), nunca métodos de `mutate` — mesmo que o scope OAuth usado tecnicamente permita mais.
- **GA4 mantém** o escopo `https://www.googleapis.com/auth/analytics.readonly`, que é, esse sim, um escopo nativamente somente leitura da Analytics Data API — assimetria real entre as duas APIs que vale ter em mente ao desenhar a integração.

### Recomendação de desenho (independente da opção escolhida)

- **Leitura e escrita sempre separadas**: para o Google Ads, isso significa usuário/role `READ_ONLY` na conta **e** a integração de monitoramento implementada para só chamar métodos de consulta, nunca `mutate` (ver modelo de acesso acima — o scope OAuth por si só não impõe essa restrição). Para o GA4, o próprio escopo `analytics.readonly` já é somente leitura por natureza.
- **Segredos nunca no frontend nem no GitHub**: `client_secret` e `refresh_token` ficam só em variáveis de ambiente de um backend/função serverless (ex.: Vercel Environment Variables marcadas como "sensitive", nunca commitadas). O repositório é público — reforço que nada disso pode ir para o Git, nem mesmo em um `.env.example` com valor real.
- **Logs**: qualquer log do backend deve mascarar tokens; nunca logar o `refresh_token` ou `access_token` completo.
- **Revogação**: com OAuth do Google, revogar é feito em https://myaccount.google.com/permissions — documentar esse caminho para quando for preciso trocar de integração.
- **Modo padrão read-only**: qualquer ferramenta/MCP conectado para esse fim deve, por padrão, ter só os escopos de leitura habilitados; se algum dia for necessário escrever (ex.: pausar uma campanha), isso deveria ser uma ação separada, autorizada explicitamente, nunca parte do fluxo de monitoramento diário.

Nenhuma credencial foi configurada, solicitada ou exposta nesta sessão.

---

## Limitações do ambiente desta sessão

1. **Dados reais de Google Ads e GA4 bloqueados** pelo limite do plano Free do Windsor.ai (1 conta simultânea, 2 conectadas) — ver Fase Inicial. Nenhum número de gasto, cliques, impressões, termos de pesquisa, sessões ou conversões pôde ser obtido ou é reportado neste documento.
2. Como consequência direta do item 1, **não foi possível**: analisar o termo de pesquisa "Devon Defaci" ou qualquer outro termo (nenhum dado de termos de pesquisa foi obtido); comparar períodos de gasto/desempenho; checar discrepância real GA4×Ads; confirmar se `whatsapp_click`/`lead_form_submit` aparecem de fato como conversões importadas no Ads.
3. Não há Google Ads API nem GA4 Data API oficiais conectadas nesta sessão — só o Windsor.ai. Segundo o usuário, o MCP oficial `googleads/google-ads-mcp` já está operacional no ambiente local dele; apenas não estava disponível nesta Cloud Session (não verificado por mim diretamente nesta sessão).

---

## Confirmação de escopo

- Nenhuma campanha, grupo de anúncios, palavra-chave, anúncio, orçamento, lance, público, conversão ou configuração de propriedade GA4/Ads foi criada, pausada, ativada, editada ou excluída.
- Nenhuma palavra-chave negativa foi adicionada.
- Nenhum client secret, refresh token ou credencial foi solicitado, exposto ou commitado.
- Nenhuma alteração foi feita no código do site (nenhum bug de rastreamento com correção segura e de baixo risco foi encontrado).
- Nenhum merge foi realizado.
