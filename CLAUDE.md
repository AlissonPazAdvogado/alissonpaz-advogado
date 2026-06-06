# Alisson Paz Advocacia — Site Institucional
> Última atualização: 2026-06-05 | Commit: `3e180bd`

---

## Infraestrutura

| Item | Valor |
|------|-------|
| **Domínio** | https://www.alissonpazadv.com.br |
| **GitHub** | https://github.com/AlissonPazAdvogado/alissonpaz-advogado |
| **Repo local** | `C:\Users\allis\OneDrive\Alisson - Pessoal\Área de Trabalho\Alisson\Site\` |
| **Vercel Project ID** | `prj_iTTWr3phhsXG7HGI6ZFciTB1jmjz` |
| **Vercel Team ID** | `team_prUTVoTIIfgX0kukpuWNJ9Yo` |
| **Deploy** | Push para `main` → Vercel auto-deploys (~1 min) |

---

## Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal |
| `obrigado.html` | Confirmação de formulário |
| `artigo-guarda-pensao.html` | Artigo família (guarda e pensão) |
| `artigo-transacao-penal.html` | Artigo penal (transação penal) |
| `artigo-negativacao-indevida.html` | Artigo consumidor (negativação) |
| `artigo-vazamento-dados.html` | Artigo digital/LGPD (vazamento) |
| `ARTIGO-PADRAO.md` | Template para novos artigos |
| `favicon.ico` | ICO oficial da marca (16/32/48px originais) |
| `favicon.svg` | SVG do escudo (para browser moderno) |
| `favicon-48x48.png` | Extraído do ICO original |
| `favicon-192x192.png` | Escalado do 48px (Android/Chrome) |
| `favicon-512x512.png` | Escalado do 48px (Google/PWA) |
| `apple-touch-icon.png` | 180x180 (iOS) |

---

## Identidade Visual (Nova — Ônix & Ouro Velho)

```css
:root {
  --dark:    #14110D;   /* ônix quente */
  --dark-2:  #1B1712;   /* superfície */
  --dark-3:  #241F18;   /* elevado */
  --dark-4:  #332C22;   /* bordas */
  --gold:    #C2A14E;   /* ouro champagne */
  --gold-lt: #E4D2A0;   /* champagne claro */
  --bronze:  #8C6B2E;
  --white:   #F4EFE3;   /* marfim */
  --gray:    #8A8073;   /* pedra quente */
  --gray-lt: #5e5648;
  --radius:  6px;
  --tr: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Fontes:**
- `Cinzel` → logo/navbar (ALISSON PAZ · Advogado) + títulos institucionais
- `Cormorant Garamond` → h1–h4, títulos de seção
- `Manrope` → corpo, UI (font-weight: 300)

**Import Google Fonts:**
```
family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@300;400;500;600
```

---

## Analytics (todas as 6 páginas)

```html
<!-- No <head> — Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5J4N177RQL"></script>

<!-- Antes do </head> — Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17974605756"></script>
```

---

## Favicons (bloco padrão — todas as páginas)

```html
<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48">
<link rel="icon" type="image/png" href="/favicon-192x192.png" sizes="192x192">
<link rel="icon" type="image/png" href="/favicon-512x512.png" sizes="512x512">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

**Canonical** (apenas index.html):
```html
<link rel="canonical" href="https://www.alissonpazadv.com.br/">
```

---

## Navbar — Estrutura HTML (todas as páginas)

```html
<a href="index.html" class="nav-logo" aria-label="Alisson Paz Advogado — página inicial">
  <div class="nav-lockup">
    <svg class="nav-mark" viewBox="0 0 240 270" fill="none" stroke="currentColor"
         stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M58,52 L182,52 Q196,52 196,66 L196,150 Q196,206 120,252 Q44,206 44,150 L44,66 Q44,52 58,52 Z"/>
      <circle cx="120" cy="37" r="6.5" stroke-width="2.6"/>
      <line x1="120" y1="43.5" x2="120" y2="96" stroke-width="2.6"/>
      <line x1="60" y1="96" x2="180" y2="96" stroke-width="2.6"/>
      <circle cx="82" cy="96" r="3.2" stroke-width="2"/>
      <circle cx="158" cy="96" r="3.2" stroke-width="2"/>
      <line x1="82" y1="99.2" x2="82" y2="112" stroke-width="2"/>
      <line x1="158" y1="99.2" x2="158" y2="112" stroke-width="2"/>
      <path d="M82,112 L65,140 Q82,147 99,140 Z" stroke-width="2.4"/>
      <path d="M158,112 L141,140 Q158,147 175,140 Z" stroke-width="2.4"/>
      <path d="M113,98 L113,230 L120,247 L127,230 L127,98" stroke-width="2.6"/>
      <line x1="120" y1="100" x2="120" y2="232" stroke-width="2"/>
    </svg>
    <div class="nav-txt">
      <span class="nav-name">ALISSON PAZ</span>
      <span class="nav-tagline">Advogado</span>
    </div>
  </div>
</a>
```

**CSS do navbar:**
```css
.nav-lockup { display: flex; align-items: center; gap: 16px; }
.nav-mark   { height: 54px; width: auto; color: var(--gold); }
.nav-txt    { display: flex; flex-direction: column; line-height: 1; }
.nav-name   { font-family: 'Cinzel', serif; font-size: 1.1rem; letter-spacing: .12em; color: var(--white); }
.nav-tagline{ font-family: 'Cinzel', serif; font-size: .58rem; letter-spacing: .4em; color: var(--gray); margin-top: 7px; }
```

---

## Estrutura index.html — Seções

1. **Navbar** fixo com menu hambúrguer mobile
2. **Hero** — foto do advogado, título Cormorant Garamond, kicker "Advocacia Estratégica"
   - Título: *"Defesa técnica, responsável e orientada pela **melhor estratégia jurídica**."*
   - Subtítulo: *"Com atuação em Advocacia Criminal, Direito do Consumidor, Direito Digital, Direito Cível e Direito de Família, o escritório presta assessoria jurídica com ética, discrição e rigor técnico."*
3. **#mapa** — mapa + info de localização
4. **#atuacao** — 5 abas: Direito Penal | Consumidor | Digital & LGPD | Cível & Contratos | Família & Inventários
5. **#diferenciais** — lista de diferenciais + quote
6. **#processo** — 3 passos (Como funciona)
7. **#conteudo** — 4 cards de artigos
8. **#contato** — formulário + info
9. **Footer** — logo lockup SVG + links + OAB/PR 119.985

---

## Regras OAB (Provimento 205/2021) — OBRIGATÓRIO

- Linguagem **estritamente informativa e institucional**
- **PROIBIDO:** promessa de resultado, linguagem mercantilista, comparações com outros advogados, depoimentos de clientes, valores de honorários, sensacionalismo
- Sidebar dos artigos: **somente TOC** — sem card de captação/WhatsApp
- **NÃO alterar** hrefs do WhatsApp: `https://wa.me/5546999746391`

---

## Mobile — Breakpoints

```css
@media (max-width: 1024px) { /* tablet */ }
@media (max-width: 768px)  { section: 72px; menu overlay; grids→1col }
@media (max-width: 480px)  { section: 56px; container: 18px; hero clamp 9.5vw }
```

**Overlay mobile:** `background: rgba(20,17,13,0.97)` — ônix quente

---

## Efeitos Globais (todas as páginas)

```css
/* Seleção de texto */
::selection { background: var(--gold); color: var(--dark); }

/* Textura grain sutil */
body::before {
  content: ""; position: fixed; inset: 0; z-index: 9999;
  pointer-events: none; opacity: .04;
  background-image: url("data:image/svg+xml,...fractalNoise...");
}
```

---

## Informações do Advogado

| Campo | Valor |
|-------|-------|
| Nome | Dr. Alisson Nascimento Paz |
| OAB | OAB/PR 119.985 |
| WhatsApp | `https://wa.me/5546999746391` |
| E-mail | allissonpaz@hotmail.com |
| Endereço | Rua Brigadeiro Rocha Loures, 219, Centro, Coronel Vivida – PR, CEP 85550-040 |
| Especialidade | Advocacia Criminal (+ Consumidor, Digital, Cível, Família) |
| Atuação | Nacional |

---

## Como Fazer Deploy

```bash
cd "C:\Users\allis\OneDrive\Alisson - Pessoal\Área de Trabalho\Alisson\Site"
git add <arquivos>
git commit -m "descrição"
git push origin main
# Vercel deploya automaticamente em ~1 min
```
