# Padrão para Criação de Artigos — Alisson Paz Advocacia

> Documento de referência para criação de novos artigos informativos no site.
> Siga este padrão exatamente para manter consistência visual, OAB-compliance e qualidade editorial.

---

## 1. Nomenclatura do Arquivo

```
artigo-[slug-do-tema].html
```

Exemplos já existentes:
- `artigo-transacao-penal.html`
- `artigo-negativacao-indevida.html`
- `artigo-vazamento-dados.html`

Slug: tudo em minúsculas, palavras separadas por hífen, sem acentos.

---

## 2. `<head>` — Estrutura Obrigatória

```html
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon.png">
  <link rel="shortcut icon" type="image/png" href="favicon.png">
  <link rel="apple-touch-icon" href="favicon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Título do Artigo] | Alisson Paz Advocacia</title>
  <meta name="description" content="[Descrição informativa de 150-160 caracteres]">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.alissonpazadv.com.br/artigo-[slug].html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <!-- GTM: INSERIR SNIPPET HEAD AQUI -->

  <style>
    /* ... CSS completo conforme template ... */
  </style>
</head>
```

**Regras críticas do `<head>`:**
- O favicon DEVE vir imediatamente após `<meta charset>`, antes de qualquer outro tag
- O `<link rel="canonical">` deve apontar para a URL exata da página
- Manter `robots: index, follow` em artigos (nunca `noindex` exceto em `obrigado.html`)

---

## 3. Imagem do Hero (Unsplash)

Cada artigo tem uma imagem de fundo no hero. Use Unsplash com parâmetros padronizados:

```
https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=1600&q=80
```

Imagens em uso:
- Direito Penal: `photo-1589829545856-d10d557cf95f` (sala de tribunal)
- Consumidor/Crédito: `photo-1563013544-824ae1b704d3` (cartão de crédito)
- LGPD/Digital: `photo-1550751827-4bd374c3f58b` (rede/dados)

Para novos artigos, busque no Unsplash uma foto que simbolize o tema.
Sempre prefira fotos com área escura ou neutra para que o overlay de texto fique legível.

---

## 4. Estrutura do Artigo — 7 Seções

Cada artigo deve ter exatamente **7 seções** de conteúdo, na seguinte ordem tipo:

1. **O que é / Contexto** — Explica o conceito principal de forma objetiva
2. **Como identificar / Quando ocorre** — Situações práticas em que o leitor pode se enquadrar
3. **Direitos do cidadão / Vantagens** — O que a lei garante ao leitor
4. **Riscos / O que evitar** — O que pode dar errado se não houver orientação
5. **Como funciona na prática** — Passo a passo ou mecânica do processo
6. **Quando recusar / Quando agir** — Tomada de decisão com base em contexto
7. **Importância da orientação jurídica** — Encerramento institucional (sem solicitar)

Cada seção: mínimo 2 parágrafos, máximo 4. Tom informativo, direto, sem jargão excessivo.

---

## 5. HTML — Estrutura do Corpo da Página

### Hero do Artigo

```html
<div class="article-hero" style="background-image: url('https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=1600&q=80');">
  <div class="article-hero-overlay"></div>
  <div class="container">
    <div class="article-hero-content">
      <span class="article-category">[Categoria: ex. Direito Penal]</span>
      <h1 class="article-hero-title">[Título do Artigo]</h1>
      <p class="article-hero-subtitle">[Subtítulo descritivo de 1 frase]</p>
      <div class="article-meta">
        <span>Dr. Alisson Nascimento Paz, OAB/PR 119.985</span>
        <span class="meta-sep">·</span>
        <span>[Tempo de leitura: ex. 8 min de leitura]</span>
      </div>
    </div>
  </div>
</div>
```

### Layout Grid (Conteúdo + Sidebar)

```html
<div class="article-layout">
  <div class="container">
    <div class="article-grid">

      <!-- CONTEÚDO PRINCIPAL -->
      <article class="article-content">
        <section class="article-section" id="secao-1">
          <h2>[Título da Seção]</h2>
          <p>...</p>
        </section>
        <!-- ... mais sections ... -->
      </article>

      <!-- SIDEBAR -->
      <aside class="article-sidebar">
        <div class="sidebar-card">
          <h4>Neste artigo</h4>
          <ul class="sidebar-toc">
            <li><a href="#secao-1">[Nome da Seção 1]</a></li>
            <!-- ... -->
          </ul>
        </div>
        <!-- NÃO adicionar outros cards na sidebar — ver regra OAB abaixo -->
      </aside>

    </div>
  </div>
</div>
```

### CTA Final (Permitido pela OAB)

```html
<!-- CTA FINAL -->
<section class="article-cta-section">
  <div class="container">
    <div class="article-cta-card">
      <h3>[Título informativo, ex.: "Ficou com dúvidas sobre este tema?"]</h3>
      <p>[Texto informativo. Sem promessas de resultado. Sem "ligue agora". Ex.: "Este escritório atua com..."]</p>
      <a href="https://wa.me/5546999746391?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20uma%20orienta%C3%A7%C3%A3o." class="btn btn-gold" target="_blank" rel="noopener" data-conversion="whatsapp-cta">
        <svg width="18" height="18" ...></svg>
        Falar pelo WhatsApp
      </a>
    </div>
  </div>
</section>
```

---

## 6. Sidebar — Regra Crítica (OAB)

A sidebar deve ter **apenas 1 card**: o índice do artigo (TOC).

**NUNCA adicionar na sidebar:**
- Cards com "Está enfrentando esta situação?"
- Botões de WhatsApp direto na sidebar
- Qualquer chamada para contato direto
- Depoimentos ou avaliações
- Promessas de resultado

**Por quê:** O Provimento 205/2021 da OAB proíbe captação de clientela. Um card na sidebar que diz "converse com o Dr. Alisson antes de qualquer decisão" é captação direta. O CTA no final da página é permitido porque está inserido no contexto do artigo informativo, não em destaque lateral isolado.

---

## 7. Regras Editoriais (OAB Provimento 205/2021)

### Permitido
- Linguagem estritamente informativa e educativa
- Explicação de conceitos jurídicos, direitos, prazos e procedimentos
- Autor identificado com nome e OAB
- CTA informativo no final do artigo (não na sidebar)
- Menção às áreas de atuação do escritório de forma contextual

### Proibido
- Promessas de resultado ("você receberá indenização", "garantimos a vitória")
- Linguagem mercantilista ou de urgência ("ligue agora", "não perca tempo")
- Comparações com outros advogados
- Depoimentos ou avaliações de clientes
- Divulgação de valores de honorários
- Sensacionalismo
- Captação direta (cards de sidebar com botão de contato)

---

## 8. Tom e Estilo do Texto (Humanizer)

### Voz
- Direta, objetiva, sem academicismo excessivo
- Primeira pessoa do plural ocasional ("o que a lei prevê", "a jurisprudência entende")
- Evitar voz imperativa excessiva ("você deve", "é obrigação sua")

### O que evitar (marcadores de texto gerado por IA)
- Travessão como conector: `—` (nunca usar; use vírgula, dois-pontos ou ponto)
- "Em termos práticos:" (substituir por "Na prática," ou sem introdutório)
- "É fundamental que" (substituir por "É importante", "vale atenção", ou reformular)
- "transformação significativa" (reformular com concretude)
- "Diferencial relevante" (reformular)
- Abertura de parágrafo com "Portanto," ou "Sendo assim," em excesso
- Listas excessivas onde prosa funciona melhor

### Exemplo de correção
❌ `"A LGPD representou uma transformação significativa — agora as empresas são responsáveis."`  
✓ `"Com a LGPD, as empresas passaram a responder pelos dados que coletam."`

---

## 9. Paleta de Cores e Fontes (não alterar)

```css
:root {
  --dark:    #080808;
  --dark-2:  #111111;
  --dark-3:  #1c1c1c;
  --gold:    #c9a84c;
  --gold-lt: #e2c77a;
  --white:   #f0ede8;
  --gray:    #888;
  --gray-lt: #555;
  --radius:  8px;
}
```

Fontes: `Playfair Display` (títulos) + `Inter` (corpo).

---

## 10. Checklist antes de Publicar

- [ ] Favicon nos primeiros tags do `<head>` (antes de `<meta name="viewport">`)
- [ ] `<link rel="canonical">` correto
- [ ] Todas as 7 seções presentes
- [ ] Sidebar com **apenas** o card de índice (TOC)
- [ ] Sem travessões no texto
- [ ] Sem promessas de resultado
- [ ] Sem depoimentos ou valores de honorários
- [ ] Autor identificado: `Dr. Alisson Nascimento Paz, OAB/PR 119.985`
- [ ] Link "← Voltar para todos os artigos" ou "← Voltar ao início" no final
- [ ] Footer com copyright e OAB/PR 119.985
- [ ] Arquivo nomeado `artigo-[slug].html`
- [ ] Card do artigo adicionado na seção "Informação que liberta" do `index.html`

---

## 11. Card do Artigo no index.html

Ao criar um novo artigo, adicionar o card correspondente na seção `#conteudo` do `index.html`:

```html
<a class="article-card fade-up" href="artigo-[slug].html">
  <div class="article-img" style="background-image: url('[MESMA URL UNSPLASH DO HERO]');"></div>
  <div class="article-tag-bar">
    <span class="article-tag">[Categoria]</span>
  </div>
  <div class="article-body">
    <h3 class="article-title">[Título do Artigo]</h3>
    <p class="article-desc">[Descrição curta de 1 a 2 frases]</p>
    <span class="article-read-more">Ler artigo <svg ...></svg></span>
  </div>
</a>
```

---

*Última atualização: maio/2026*  
*OAB/PR 119.985 — Alisson Nascimento Paz Advocacia*
