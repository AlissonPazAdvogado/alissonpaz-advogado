# Infraestrutura Oficial de Leitura Read-Only — Google Ads + GA4
> Etapa 4 do projeto de auditoria/otimização do site `alissonpaz-advogado`
> Baseline: `main @ dbc83cfac7ac60cc152e33a7508bc544e2f6f26d`
> Branch desta etapa: `infra/official-ads-ga4-readonly-2026-09`
> Status: **PROPOSTA — nenhum recurso externo foi criado. Nenhum merge. Nenhum deploy.**
> Data: 2026-09-25

---

## Aviso de escopo e limites desta etapa

Este documento é **exclusivamente de planejamento e documentação**. Nada aqui:

- altera o site em produção (`index.html`, CSS, JS, Vercel);
- cria, altera ou remove qualquer campanha, orçamento, lance, palavra-chave, anúncio ou conversão no Google Ads;
- altera propriedades, eventos ou configurações do GA4;
- cria projeto GCP, Cliente OAuth, segredo no Secret Manager, banco Firestore ou qualquer outro recurso na nuvem;
- conecta qualquer conta real.

Tudo que exige criação de recurso externo, alteração de permissão ou segredo real está marcado abaixo como **DEPENDE DE AÇÃO DO USUÁRIO** e não foi executado.

---

## 1. Inventário do ambiente (FASE 2) — **VERIFICADO nesta sessão**

Inspeção estritamente somente-leitura, sem impressão de conteúdo de nenhum arquivo de credencial:

| Item | Resultado |
|---|---|
| `gcloud` CLI | **Não instalado** nesta Cloud Session |
| Docker | Instalado (`/usr/bin/docker`) |
| Python | 3.11.15 |
| Node.js | 22.22.2 |
| `GOOGLE_APPLICATION_CREDENTIALS` (env var) | Vazia/não definida |
| `~/.config/gcloud/` (ADC local) | Não existe nesta sessão |
| `gh` CLI | Não instalado (uso do GitHub MCP) |
| Conector MCP `google-ads-mcp` nesta sessão | **Não disponível** (confirmado via busca de conectores) |
| Conector MCP GA4/GCP nesta sessão | Não disponível |
| Windsor.ai | Disponível, mas fora do escopo desta etapa (não deve ser arquitetura primária, conforme Fase 3 já auditada) |

**Conclusão:** esta Cloud Session não tem, e não pode obter, qualquer acesso real a Google Ads, GA4 ou GCP. A instalação local de `googleads/google-ads-mcp` mencionada pelo usuário existe apenas na máquina local dele, fora do alcance desta sessão. Nenhuma tentativa de leitura de credencial foi feita — nenhuma é necessária para o inventário acima.

---

## 2. Documentação oficial consultada (FASE 1) — **VERIFICADO, com uma limitação de ambiente registrada**

**Limitação de ambiente confirmada:** o domínio `developers.google.com` está bloqueado pelo proxy de egress desta sessão (`EGRESS_BLOCKED`, testado duas vezes em URLs distintas: página de níveis de acesso da API Google Ads e visão geral da GA4 Data API v1). `github.com` e `raw.githubusercontent.com` estão acessíveis. Por isso, a pesquisa abaixo combina (a) leitura direta do repositório oficial `googleads/google-ads-mcp` no GitHub e (b) buscas na web com síntese de múltiplas fontes, quando o fetch direto ao domínio do Google foi impossível. Nenhuma informação abaixo foi inventada; onde a fonte primária do Google não pôde ser lida diretamente, isso está identificado.

### 2.1 Repositório oficial `googleads/google-ads-mcp`

Fonte: leitura direta do README em `https://github.com/googleads/google-ads-mcp` (sucesso).

- **Ferramentas expostas — todas somente-leitura, sem exceção:**
  - `search` — executa consultas GAQL (Google Ads Query Language) de leitura;
  - `get_resource_metadata` — metadados de recursos/campos da API;
  - `list_accessible_customers` — lista contas acessíveis pelas credenciais configuradas.
  - **Não há nenhuma ferramenta de `mutate`, `create`, `update` ou `remove`.** Isso é uma característica de design do servidor oficial, não uma configuração que precise ser desabilitada — é um controle técnico de defesa em profundidade já embutido (ver item 8).
- **Transportes suportados:** `stdio` (uso local, é o que o usuário já tem funcionando) e `streamable-http` (uso remoto, necessário para uma implantação em nuvem acessível por esta e por outras Cloud Sessions).
- **Proxy OAuth:** o servidor implementa seu próprio proxy OAuth (baseado em FastMCP), com variáveis de ambiente próprias (`GOOGLE_ADS_MCP_OAUTH_CLIENT_ID`, `GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET`, `GOOGLE_ADS_MCP_BASE_URL`, `GOOGLE_ADS_MCP_JWT_SIGNING_KEY`) — este proxy é a camada de autenticação do próprio protocolo MCP, independente da camada de rede do Cloud Run.
- **Backends de armazenamento de estado OAuth (`GOOGLE_ADS_MCP_STORAGE_TYPE`):** `filetree`, `redis`, `firestore`, `memory`. O próprio projeto recomenda `firestore` para produção, via Application Default Credentials (ADC) do serviço, com criptografia em repouso suportada.
- **Exemplo de deploy documentado no próprio repositório usa `gcloud run deploy ... --allow-unauthenticated`** — ver item 6 abaixo para a reconciliação disso com o requisito do usuário de "nenhuma porta pública desnecessária" / "autenticação obrigatória".
- **`GOOGLE_ADS_DEVELOPER_TOKEN` ainda aparece como variável de ambiente no exemplo de deploy**, embora opcional/ignorado sob o novo modelo de acesso (ver item 2.2) — ver reconciliação no item 2.3.

### 2.2 Modelo de acesso da API Google Ads (vigente desde 9/09/2026)

Fonte: busca na web com múltiplas fontes convergentes (fetch direto a `developers.google.com` bloqueado nesta sessão). Estes achados **confirmam integralmente** o que o usuário já havia afirmado, sem contradição:

- O nível de acesso deixou de ser determinado pelo developer token e passou a ser associado ao **Google Cloud Project** usado para gerar as credenciais OAuth.
- Três níveis: **Test Account Access**, **Basic Access**, **Standard Access**. Os dois últimos permitem operar contas de produção; apenas o Standard Access remove os limites de operação.
- O escopo OAuth permanece `https://www.googleapis.com/auth/adwords` — **não existe escopo somente-leitura separado** para a API Google Ads.
- O developer token continua aceito nos headers por retrocompatibilidade, porém **é ignorado** pelo novo modelo; está previsto ser totalmente removido das chamadas em uma versão futura (~1º semestre de 2027, segundo a documentação sintetizada).

**Recomendação decorrente:** como não existe escopo OAuth read-only para Google Ads, o caráter somente-leitura desta infraestrutura deve ser garantido por controles adicionais, não pelo escopo em si (ver item 8).

### 2.3 Reconciliação — `GOOGLE_ADS_DEVELOPER_TOKEN` no exemplo de deploy

A variável aparece porque a API Google Ads ainda **aceita** (embora ignore) o developer token no header de cada requisição, por retrocompatibilidade. O `google-ads-mcp`, sendo um cliente genérico da API, mantém a variável de ambiente para não quebrar contas que ainda dependem do comportamento legado, e porque a Google não removeu formalmente o campo do payload de requisição. Não há contradição: o token pode ser fornecido (mesmo que hoje irrelevante para a decisão de acesso) sem nenhum efeito sobre o caráter read-only da integração.

### 2.4 GA4 Data API (v1)

Fonte: busca na web com múltiplas fontes (fetch direto a `developers.google.com` bloqueado nesta sessão):

- **Escopo:** `https://www.googleapis.com/auth/analytics.readonly` é suficiente para `runReport`, `runRealtimeReport`, `batchRunReports`, `runPivotReport` e `getMetadata`. Este escopo é **genuinamente read-only** — ao contrário do Google Ads, aqui existe uma separação real entre a API de leitura de dados (Data API) e a API de administração (Admin API, que tem escopos distintos e não deve ser usada nesta arquitetura).
- **Categorias de cota:** Core (para `runReport` e afins), Realtime (para `runRealtimeReport`) e Funnel. Para propriedades Standard: 200.000 tokens Core/propriedade/dia, 40.000/propriedade/hora, 10 requisições simultâneas/propriedade — limites folgados para o volume de consultas diárias previsto neste projeto (uma conta, poucas consultas por dia).
- **Realtime API:** cobre os últimos 30 minutos de atividade; não é necessária para o caso de uso principal (relatório diário), mas pode ser adicionada como ferramenta de baixo risco se o usuário desejar visibilidade "ao vivo" pontual.
- **Cliente oficial:** biblioteca Python `google-analytics-data` (`BetaAnalyticsDataClient` / `AnalyticsDataClient`), compatível com ADC.

---

## 3. Arquitetura alvo recomendada (FASE 3) — **PROPOSTA**

```
                          ┌─────────────────────────────────────────┐
                          │   Google Cloud Project                  │
                          │   (existente OU novo — a decidir após    │
                          │    identificar o projeto/nível de acesso │
                          │    já usado pelo google-ads-mcp local;    │
                          │    ver item 4 e item 9. Nenhuma criação  │
                          │    de projeto novo é recomendada agora.) │
                          └───────────────┬───────────────────────--┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌───────────────────┐         ┌───────────────────────┐          ┌──────────────────────┐
│  Cloud Run:        │         │  Secret Manager        │          │  Firestore            │
│  google-ads-mcp     │◄───────┤  - OAuth client secret │          │  - estado OAuth        │
│  (imagem oficial,   │  lê     │  - JWT signing key     │          │    (tokens criptogr.)  │
│  não-forkada)       │        └───────────────────────┘          └──────────────────────┘
│  Streamable HTTP    │
│  + OAuth Proxy       │
│  Ingress: público     │
│  (padrão upstream)   │
│  OU privado + IAM     │
│  (hardening, a testar)│
└─────────┬───────────┘
          │ chamadas somente-leitura
          │ (search / get_resource_metadata / list_accessible_customers)
          ▼
┌───────────────────────┐
│  Google Ads API        │
│  escopo: adwords        │
│  role da conta: READ_ONLY│
└───────────────────────┘

┌───────────────────────┐         ┌───────────────────────┐
│  Cloud Run:             │         │  Secret Manager         │
│  ga4-readonly-mcp        │◄────────┤  - client secret/ADC    │
│  (serviço próprio,        │        └───────────────────────┘
│   mínimo, custom)          │
│  Ingress: privado           │
└─────────┬───────────────┘
          │ chamadas somente-leitura
          │ (runReport / runRealtimeReport, escopo analytics.readonly)
          ▼
┌───────────────────────┐
│  GA4 Data API v1        │
│  propriedade única       │
└───────────────────────┘

          ▲                                 ▲
          │ IAM invoker (identidade)         │ IAM invoker (identidade)
          │                                 │
┌─────────┴─────────────────────────────────┴─────────┐
│   Clientes MCP autorizados                             │
│   (Claude Code / Cloud Sessions, com identidade GCP     │
│    federada ou token de invoker do Cloud Run)           │
└─────────────────────────────────────────────────────┘
```

**Fluxo textual resumido:**
1. Um agente (Claude, em Cloud Session ou local) autentica-se no serviço Cloud Run via identidade IAM (não anonimamente).
2. O serviço `google-ads-mcp` (imagem oficial upstream) responde apenas a `search`, `get_resource_metadata`, `list_accessible_customers` — nunca a mutações, porque elas não existem no binário.
3. O serviço `ga4-readonly-mcp` (implementação própria mínima) responde a um conjunto fixo de ferramentas de relatório pré-definidas, nunca a consultas arbitrárias contra outras propriedades.
4. Ambos os serviços leem segredos (client secret, chave de assinatura JWT) do Secret Manager em tempo de execução — nunca embutidos em imagem, código ou variável de ambiente em texto puro no console.
5. O estado OAuth (refresh tokens) fica em Firestore, criptografado em repouso, nunca no repositório do site nem em log.
6. A saída (dados de Ads/GA4) é consumida por um processo de análise diária que gera texto/relatório — mudanças de campanha exigem aprovação humana fora deste fluxo.

---

## 4. Google Cloud Project necessário — **DEPENDE DE AÇÃO DO USUÁRIO — decisão de criação adiada**

**Não recomendamos ainda criar um novo Google Cloud Project para o Google Ads.** O passo anterior a qualquer decisão sobre projeto é identificar **qual projeto OAuth já está sendo usado hoje pelo `google-ads-mcp` local** (o que já funciona na máquina do usuário) e **qual o nível de acesso** desse projeto na API Google Ads (Test Account Access, Basic Access ou Standard Access — ver item 2.2).

Isso importa porque, sob o modelo vigente desde 9/09/2026, o nível de acesso é uma propriedade do **projeto** que gerou as credenciais OAuth — não da aplicação ou do ambiente de execução. Se o projeto já em uso local já tiver Basic Access ou Standard Access habilitado para a conta de produção, **criar um projeto novo obrigaria repetir todo o processo de obtenção de nível de acesso** (que pode envolver revisão/aprovação da Google), sem nenhum ganho de segurança correspondente — isolamento de IAM e faturamento pode ser obtido também dentro do mesmo projeto, por meio de Service Accounts e políticas de IAM dedicadas.

**Ordem correta de decisão:**
1. Executar os comandos do item 9 para identificar o projeto atual e seu nível de acesso.
2. Só então decidir, com base no resultado, entre: (a) reaproveitar o projeto existente (com IAM/Service Account dedicados para esta infraestrutura de monitoramento) ou (b) criar um projeto novo — apenas se houver razão técnica concreta (por exemplo, o projeto atual não suportar produção, ou misturar responsabilidades incompatíveis).

Nenhum projeto foi criado ou proposto como certo nesta sessão; esta seção permanece como **DEPENDE DE AÇÃO DO USUÁRIO**, com a criação de projeto novo explicitamente **não recomendada neste momento**.

---

## 5. Modelo OAuth — **PROPOSTA**

- **Google Ads:** um único Cliente OAuth (tipo "Aplicativo Web", ou "Desktop" se preferir o fluxo do `google-ads-mcp` local) associado ao projeto GCP identificado no item 4 (existente ou, apenas se justificado, um novo), escopo `https://www.googleapis.com/auth/adwords` (não há alternativa read-only). O papel do usuário/conta dentro do Google Ads deve ser configurado como **`READ_ONLY`** sempre que a interface do Google Ads permitir vincular esse papel à credencial usada pela integração — isso é uma camada adicional de proteção independente do escopo OAuth (ver item 8).
- **GA4:** um Cliente OAuth (pode ser o mesmo projeto GCP, credencial separada) com escopo **exclusivo** `https://www.googleapis.com/auth/analytics.readonly` — nunca solicitar escopos da Admin API.
- Ambos os fluxos usam **Application Default Credentials (ADC)** do serviço Cloud Run (Service Account dedicada, sem chaves JSON baixadas) sempre que possível, reduzindo a superfície de segredos a gerenciar manualmente.

---

## 6. Modelo de armazenamento de token e reconciliação de autenticação (FASE 7 parcial) — **PROPOSTA**

### 6.1 Armazenamento
- **Refresh tokens:** Firestore (backend nativo recomendado pelo próprio `google-ads-mcp`), com criptografia em repouso nativa do Firestore + criptografia adicional em nível de aplicação usando a chave gerenciada pelo Secret Manager (`GOOGLE_ADS_MCP` já expõe variáveis para isso).
- **Client secret / JWT signing key:** exclusivamente no Secret Manager, montados como variável de ambiente/volume no momento da execução do container — nunca no código, nunca no `Dockerfile`, nunca em `.env` versionado.
- **Estado OAuth (nonce, PKCE, sessão de autorização):** também em Firestore, com TTL curto.
- **Correção sobre limpeza do Firestore:** o backend Firestore do `google-ads-mcp` **filtra** registros de estado OAuth expirados nas consultas (isto é, um registro vencido deixa de ser considerado válido em tempo de leitura), mas **não os remove automaticamente** da coleção. Em uma implantação de longa duração, isso significa que documentos expirados se acumulam indefinidamente no Firestore se nenhuma limpeza periódica for configurada. Recomendação: agendar uma rotina de expurgo (por exemplo, uma Cloud Scheduler job + Cloud Function/Run job simples, ou uma TTL policy nativa do Firestore sobre o campo de expiração, quando aplicável ao esquema usado pelo projeto) para remover fisicamente registros vencidos periodicamente — evitando crescimento não controlado de armazenamento e reduzindo a superfície de dados obsoletos retidos.

### 6.2 `--allow-unauthenticated` vs. exigência de autenticação obrigatória — **opção de hardening a validar, não decisão arquitetural fechada**

**O que o exemplo oficial realmente faz:** o exemplo de deploy do repositório `googleads/google-ads-mcp` usa `--allow-unauthenticated` e expõe o serviço em um **endpoint HTTP publicamente alcançável**; a autenticação de cada chamada é feita inteiramente pela **camada de aplicação** — o proxy OAuth do próprio MCP (FastMCP), que exige um token MCP/OAuth válido para qualquer ferramenta ser executada. Isto é, a arquitetura oficial já documentada e testada pelo mantenedor do projeto não depende de restrição de rede alguma: a porta é pública, mas inútil sem o token OAuth do próprio protocolo MCP.

**Por que isso não deve ser descartado de imediato em favor de `--no-allow-unauthenticated` + IAM:** essa combinação (ingress do Cloud Run exigindo identidade IAM, via `roles/run.invoker` + token de identidade do Google) é uma camada adicional de hardening, não uma peça testada do fluxo padrão do `google-ads-mcp`. Ela pode conflitar com o próprio handshake OAuth do FastMCP — por exemplo, se o cliente MCP remoto (Claude, ChatGPT ou outro) não conseguir anexar automaticamente um Google ID token (`Authorization: Bearer <identity-token>`) às chamadas HTTP subjacentes ao mesmo tempo em que conduz o fluxo OAuth do próprio MCP (que pode envolver redirecionamentos, callbacks e headers próprios), o resultado pode ser a própria autenticação do MCP quebrando antes de chegar à aplicação.

**Recomendação revisada — tratar como duas opções, a maior restritiva pendente de teste:**

- **Opção A (padrão documentado pelo upstream):** `--allow-unauthenticated` no Cloud Run + autenticação exclusivamente pelo proxy OAuth do `google-ads-mcp`. Vantagem: é o caminho testado e suportado pelo mantenedor, sem risco de incompatibilidade entre camadas de auth. Desvantagem: não atende, por si só, ao requisito do usuário de "nenhuma porta pública desnecessária".
- **Opção B (hardening adicional, a validar):** `--no-allow-unauthenticated` + `roles/run.invoker` restrito, resultando em autenticação dupla (IAM na borda + OAuth do MCP na aplicação). **Antes de adotar esta opção como arquitetura definitiva, é necessário testar em ambiente de laboratório** se um cliente MCP remoto (Claude/ChatGPT) consegue efetivamente fornecer o Google ID token exigido pelo Cloud Run sem quebrar o fluxo OAuth do FastMCP — por exemplo, verificando se o cliente suporta headers de autorização customizados persistentes junto ao transporte Streamable HTTP, ou se será necessário um proxy/túnel local (`gcloud run services proxy`) como intermediário, o que reduziria a praticidade do uso remoto direto por um agente.

Esta seção permanece **em aberto**: nenhuma das duas opções foi testada nesta sessão (não há ambiente Cloud Run real disponível). A decisão final deve ser tomada somente após um teste controlado da Opção B; até lá, a Opção A (igual ao exemplo oficial) é o fallback conhecido e funcional.

---

## 7. Arquitetura Google Ads (detalhe) — **PROPOSTA**

- Imagem: `googleads/google-ads-mcp` **oficial, sem fork**, versão fixada (tag/digest, não `latest`) para reprodutibilidade e auditoria de supply chain.
- Transporte: `streamable-http`.
- Storage: `firestore`.
- Ferramentas expostas ao cliente MCP: as três nativas do projeto (`search`, `get_resource_metadata`, `list_accessible_customers`) — nenhuma ferramenta adicional deve ser criada que exponha `mutate`.
- Escopo de consulta: restringir, no nível da conta Google Ads vinculada (papel `READ_ONLY` quando disponível) e, se o volume justificar, também no nível de configuração do serviço (allow-list de `customer_id` esperado), para impedir que a credencial, se comprometida, alcance contas além da do escritório.

---

## 8. Estratégia read-only / defesa em profundidade (FASE 6) — **VERIFICADO + PROPOSTA**

| Camada | Controle | Status |
|---|---|---|
| 1 — Escopo OAuth | `adwords` (Ads, não há alternativa) / `analytics.readonly` (GA4, genuinamente read-only) | Verificado (documentação oficial/sintetizada) |
| 2 — Papel da conta | `READ_ONLY` na conta Google Ads vinculada, quando a interface permitir | Proposto — depende de ação do usuário no Google Ads |
| 3 — Design do servidor MCP (Ads) | `google-ads-mcp` oficial não expõe nenhuma ferramenta de mutação — comprovado por leitura direta do README/lista de tools | **Verificado nesta sessão** |
| 4 — Design do servidor MCP (GA4) | Implementação própria deve expor **apenas** ferramentas de relatório pré-definidas, nunca uma ferramenta de query arbitrária ou qualquer chamada à Admin API | Proposto (a implementar) |
| 5 — IAM na borda | `--no-allow-unauthenticated` + `roles/run.invoker` restrito (opção B, hardening) vs. `--allow-unauthenticated` + OAuth do MCP (opção A, padrão upstream) | Em aberto — nenhuma opção testada; decisão pendente de teste do handshake OAuth do FastMCP com ID token do Cloud Run (ver item 6.2) |
| 6 — Auditoria/log | Cloud Logging padrão do Cloud Run, sem log de payload de token | Proposto |
| 7 — Separação write | Qualquer operação futura de escrita (ex.: pausar campanha) deve ser uma integração **distinta**, com credencial e serviço próprios, nunca reaproveitando esta infraestrutura de monitoramento | Regra de design — a ser respeitada em qualquer etapa futura |

---

## 9. Comandos para o usuário executar localmente (FASE 5) — **DEPENDE DE AÇÃO DO USUÁRIO**

Nenhum destes comandos foi executado nesta sessão (não há `gcloud` disponível aqui, e mesmo que houvesse, não devo tentar acessar credenciais locais do usuário). Rode-os na sua máquina, onde o `google-ads-mcp` já funciona, e me envie apenas as **saídas não sensíveis** (nomes/IDs de projeto, status de API, nível de acesso, mensagens de erro já sanitizadas) — nunca cole conteúdo de arquivos de credencial, client secret, refresh token, access token ou cookies.

```bash
# 1. Conta autenticada atualmente no gcloud
gcloud auth list

# 2. Projeto GCP atualmente configurado
gcloud config get-value project

# 3. Application Default Credentials configuradas (apenas existência/metadados, não o conteúdo)
gcloud auth application-default print-access-token >/dev/null && echo "ADC OK" || echo "ADC ausente"

# 4. APIs habilitadas no projeto (verificar se Google Ads API e Analytics Data API já estão ativas)
gcloud services list --enabled --filter="name:googleads.googleapis.com OR name:analyticsdata.googleapis.com"

# 5. Clientes OAuth já existentes no projeto (apenas nomes/IDs, nunca secrets)
#    gcloud iam oauth-clients é para o recurso genérico de OAuth Clients
#    (Workforce/Workload Identity); Clientes OAuth "clássicos" (tipo Web/
#    Desktop, os usados pelo fluxo padrão de Cliente OAuth para APIs de
#    usuário como Google Ads/GA4) não têm listagem via gcloud e devem ser
#    conferidos no Console. Use o comando abaixo apenas se aplicável ao
#    seu caso (ex.: OAuth Clients do tipo Workforce Identity Federation);
#    caso contrário, vá direto ao Console.
gcloud iam oauth-clients list --location=global --project=$(gcloud config get-value project) 2>/dev/null || \
  echo "Consulte em: https://console.cloud.google.com/apis/credentials"

# 6. Nível de acesso atual da API Google Ads para este projeto
#    (não existe comando gcloud direto; verificar no Google Ads:
#     Ferramentas e Configurações > Configuração > Centro de API > Nível de acesso)
echo "Verificar manualmente em: https://ads.google.com/aw/apicenter"

# 7. Confirmar se o google-ads-mcp local já está usando este mesmo projeto
#    (inspecionar, sem imprimir o conteúdo, se a variável aponta para um client_secret deste projeto)
echo $GOOGLE_ADS_MCP_OAUTH_CLIENT_ID | cut -c1-12  # mostra só o prefixo, nunca o valor completo
```

Envie-me apenas: nome/ID do projeto, se as duas APIs aparecem como `ENABLED`, o nível de acesso mostrado no API Center do Google Ads, e se já existe um Cliente OAuth (só o nome, não o secret).

---

## 10. Estimativa de custo mensal (FASE 8) — **PROPOSTA (estimativa)**

Cenário: uma conta Google Ads, uma propriedade GA4, poucas consultas diárias (relatório automatizado 1x/dia + eventuais consultas pontuais), tráfego muito baixo ao backend.

| Serviço | Camada gratuita relevante | Uso estimado | Custo esperado |
|---|---|---|---|
| Cloud Run (2 serviços: Ads MCP + GA4 MCP) | 180.000 vCPU-s, 360.000 GiB-s, 2 milhões de requisições/mês grátis | Poucas dezenas de requisições/dia, containers com `min-instances=0` (scale-to-zero) | **US$ 0** na prática, dentro da camada gratuita |
| Secret Manager | 6 versões de segredo ativas + 10.000 acessos/mês grátis | 2–4 segredos, poucos acessos/dia | **US$ 0** ou centavos, improvável ultrapassar |
| Firestore (Native mode) | 1 GiB armazenamento + 50.000 leituras/20.000 escritas por dia grátis | Poucos documentos de estado OAuth, poucas leituras/escritas por dia | **US$ 0** |
| Cloud Logging | 50 GiB/mês grátis | Volume mínimo | **US$ 0** |
| Google Ads API | Sem custo de uso da API em si (cobrança é apenas por gasto em campanhas, que não muda aqui) | — | **US$ 0** adicional |
| GA4 Data API | Sem custo de uso dentro das cotas gratuitas padrão | — | **US$ 0** adicional |
| Egress de rede (saída de dados do GCP) | 1 GiB/mês grátis (varia por destino) | Payloads de texto pequenos (JSON de relatório) | **US$ 0**, improvável ultrapassar 1 GiB/mês com este volume |

**Condições que gerariam cobrança real:** manter `min-instances >= 1` nos serviços Cloud Run (evitar cold start, mas custo contínuo pequeno, algo como US$ 5–15/mês por serviço dependendo da região/CPU); volume de consultas muito acima do descrito (dashboards com polling agressivo); uso do nível Analytics 360 (não aplicável, propriedade é Standard); armazenamento de histórico extenso em Firestore ao longo de anos sem expurgo.

**Conclusão de custo:** para o cenário descrito pelo usuário, a expectativa realista é **efetivamente gratuita** dentro das camadas gratuitas do GCP, mas não é contratualmente "grátis para sempre" — é dependente de manter o uso dentro dos limites acima.

---

## 11. Separação de repositório (FASE 4) — **PROPOSTA, aguardando decisão do usuário**

Recomendação: **não** implementar esta infraestrutura no repositório `alissonpaz-advogado` (site público). Justificativa técnica:
- O repositório do site é público; mesmo sem segredos reais, arquivos de configuração de infraestrutura (Dockerfiles, scripts de deploy, nomes de projeto GCP) aumentam a superfície de reconhecimento para um atacante, sem necessidade.
- README/documentação de arquitetura (este arquivo) é aceitável manter aqui, por ser puramente descritivo — mas o **código executável** do servidor GA4 read-only, `Dockerfile`s, scripts de deploy e configuração de CI/CD para os serviços Cloud Run devem ficar em repositório próprio.

**Proposta de novo repositório (não criado — depende de autorização explícita do usuário):**
- Nome sugerido: `alissonpaz-ads-ga4-monitor` (ou `alissonpaz-advogado-infra`, se o usuário preferir um nome mais genérico para futura reutilização).
- Visibilidade: **privado** (diferente do site, que é público) — este repositório conterá lógica operacional e, eventualmente, referências a IDs de projeto/conta que, mesmo não sendo segredos, não precisam ser públicos.
- Estrutura sugerida:
  ```
  alissonpaz-ads-ga4-monitor/
  ├── services/
  │   ├── google-ads-mcp/        # apenas Dockerfile + config de deploy, referenciando a imagem oficial upstream (sem fork)
  │   └── ga4-readonly-mcp/      # código-fonte próprio, mínimo, das ferramentas de relatório GA4
  ├── deploy/
  │   ├── cloud-run-ads.yaml
  │   └── cloud-run-ga4.yaml
  ├── docs/
  │   └── ARCHITECTURE.md
  └── README.md
  ```
- Nenhum arquivo `.env` ou credencial deve ser versionado; usar `.env.example` apenas com nomes de variáveis.

---

## 12. Desenho de monitoramento diário (FASE 11) — **PROPOSTA**

Conjunto de métricas a produzir diariamente (somente leitura, sem nenhuma ação automática de alteração):

**Google Ads:** investimento (spend), impressões, cliques, CTR, CPC médio, termos de pesquisa, palavras-chave e seus tipos de correspondência, conversões reportadas no próprio Ads.

**GA4:** sessões, usuários, origem/mídia (source/medium), páginas de destino, categoria de dispositivo, eventos — com atenção específica aos eventos customizados já auditados na Fase 3: `whatsapp_click` e `lead_form_submit`.

**Cruzamento Ads × GA4:** comparação de conversões reportadas nativamente no Google Ads versus os eventos de conversão observados no GA4, para identificar divergência/possível dupla contagem — sem enviar nenhum dado de volta ao Ads a partir deste fluxo (qualquer integração de importação de conversão GA4→Ads é uma decisão de escrita, fora do escopo desta etapa e exige autorização e desenho específicos).

**Tendências:** comparação período a período (semana vs. semana anterior, mês vs. mês anterior).

**Nota obrigatória preservada:** o termo de pesquisa **"Devon Defaci"**, identificado em etapas anteriores como potencialmente relevante no contexto de atuação regional em advocacia criminal, deve permanecer documentado como tal e **nunca deve ser negativado automaticamente** por qualquer rotina deste sistema de monitoramento. Este sistema produz apenas dados e recomendações; qualquer negativação de termo, alteração de lance, pausa de campanha ou qualquer outra mudança operacional exige decisão e execução humana, fora deste pipeline.

**Saída do sistema:** relatório de texto (ou painel simples) resumindo os números acima e sinalizando anomalias — nunca uma ação executada automaticamente sobre Google Ads ou GA4.

---

## 13. Prova de conceito (FASE 10) — **NÃO EXECUTADA, conforme regra explícita**

Conforme instrução do usuário, como esta Cloud Session **não** possui credenciais seguras e autenticadas para Google Ads ou GA4 (confirmado no item 1), nenhuma chamada real foi tentada. Os comandos necessários para o usuário validar o acesso local estão no item 9. Quando o usuário confirmar acesso local funcional (nível de acesso, projeto, APIs habilitadas), uma prova de conceito real pode ser conduzida — preferencialmente a partir do ambiente local do usuário, onde o `google-ads-mcp` já está operacional, e não desta Cloud Session.

---

## 14. Código criado nesta etapa — **NENHUM CÓDIGO EXECUTÁVEL**

Nesta etapa, apenas este documento de arquitetura (`INFRA_ADS_GA4_READONLY_2026-09.md`) foi criado. Nenhum `Dockerfile`, script de deploy, chave, cliente OAuth ou código do serviço GA4 read-only foi escrito, porque:
- a decisão de repositório (item 11) ainda depende de autorização do usuário;
- qualquer esqueleto de código do serviço GA4 sem um projeto GCP real para testar teria valor limitado e correria o risco de divergir da configuração real assim que o projeto for criado.

Caso o usuário prefira, o próximo passo autorizado pode incluir um esqueleto mínimo (sem segredos, não-funcional até configuração) do serviço `ga4-readonly-mcp`, a ser criado já no repositório novo (item 11) e não neste.

---

## 15. Branch / PR desta etapa

- Branch: `infra/official-ads-ga4-readonly-2026-09`, criada a partir de `main @ dbc83cfac7ac60cc152e33a7508bc544e2f6f26d`.
- Arquivo adicionado: `INFRA_ADS_GA4_READONLY_2026-09.md` (somente este arquivo; nenhum arquivo do site foi tocado).
- PR: a ser aberto como **Draft**, sem merge, aguardando revisão e autorização explícita do usuário.

---

## 16. Próximos passos, em ordem, cada um aguardando autorização explícita

1. Usuário roda os comandos do item 9 localmente e envia as saídas não sensíveis.
2. Usuário decide, com base no resultado do item 1: reaproveitar o projeto GCP já usado pelo `google-ads-mcp` local (opção recomendada, se o nível de acesso já for adequado) ou, apenas com justificativa técnica concreta, criar um projeto novo.
3. Usuário decide sobre a separação de repositório (item 11) — nome, visibilidade, e autoriza (ou não) a criação.
4. Somente após 2 e 3: criação do Cliente OAuth para Google Ads (escopo `adwords`, papel `READ_ONLY` na conta quando possível) e para GA4 (escopo `analytics.readonly`).
5. Configuração do Secret Manager e Firestore no projeto (após 2).
6. Implementação do serviço `ga4-readonly-mcp` mínimo no novo repositório (após 3).
7. Deploy de teste do `google-ads-mcp` oficial (imagem não-forkada) e do `ga4-readonly-mcp` em Cloud Run, começando pela Opção A (`--allow-unauthenticated` + OAuth do MCP, igual ao padrão upstream) e só então testando a Opção B (`--no-allow-unauthenticated` + IAM invoker) em laboratório, validando se o cliente MCP remoto consegue fornecer o ID token exigido sem quebrar o fluxo OAuth do FastMCP (após 4 e 5; ver item 6.2).
8. Prova de conceito real (FASE 10), a partir de credenciais já validadas (após 7).
9. Ativação do relatório diário (FASE 11).

Nenhum destes 9 passos foi executado nesta sessão. Esta etapa termina aqui, aguardando autorização.

---

## Resumo por status

- **Verificado nesta sessão:** inventário de ambiente (item 1); design read-only do `google-ads-mcp` oficial (itens 2.1 e 8); confirmação do modelo de acesso pós-9/09/2026 (item 2.2); bloqueio de egress a `developers.google.com` (item 2, nota de limitação); comportamento do Firestore quanto a registros OAuth expirados — filtrados na leitura, não removidos automaticamente (item 6.1).
- **Proposto (não implementado):** arquitetura geral de serviços/segredos (itens 3, 5–8, 10–12); estimativa de custo (item 10); separação de repositório (item 11).
- **Em aberto, sem decisão tomada (requer teste antes de decidir):** criação de novo Google Cloud Project para o Google Ads — não recomendada até identificar o projeto/nível de acesso já em uso local (item 4); escolha entre Opção A (`--allow-unauthenticated`, padrão upstream) e Opção B (`--no-allow-unauthenticated` + IAM) para o ingress do Cloud Run — pendente de teste do handshake OAuth do FastMCP com ID token (item 6.2).
- **Depende de ação do usuário:** descoberta de projeto GCP e Cliente OAuth já em uso (item 9, comando de listagem corrigido para `gcloud iam oauth-clients list --location=global`); criação de qualquer recurso GCP; decisão sobre novo repositório; autorização de deploy.
- **Não executado por regra explícita:** prova de conceito real (item 13); qualquer alteração em Google Ads, GA4, Vercel ou no site.
