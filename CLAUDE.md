# Alisson Paz Advocacia — Site Institucional

## Visão Geral
Site estático HTML/CSS/JS de advocacia criminal. Hospedado no **Vercel** com deploy automático via GitHub.

- **Domínio:** https://www.alissonpazadv.com.br
- **Repositório GitHub:** https://github.com/AlissonPazAdvogado/alissonpaz-advogado
- **Vercel Project ID:** prj_iTTWr3phhsXG7HGI6ZFciTB1jmjz
- **Vercel Team ID:** team_prUTVoTIIfgX0kukpuWNJ9Yo

## Arquivos do Projeto
| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal do site |
| `obrigado.html` | Página de confirmação após envio de formulário |
| `artigo-guarda-pensao.html` | Artigo: guarda e pensão alimentícia (Família) |
| `artigo-transacao-penal.html` | Artigo: transação penal (Penal) |
| `artigo-negativacao-indevida.html` | Artigo: negativação indevida (Consumidor) |
| `artigo-vazamento-dados.html` | Artigo: vazamento de dados (LGPD/Digital) |
| `ARTIGO-PADRAO.md` | Template padrão para novos artigos |

## Identidade Visual
```css
--dark:    #080808
--dark-2:  #111111
--dark-3:  #1c1c1c
--gold:    #c9a84c
--gold-lt: #e2c77a
--white:   #f0ede8
--gray:    #888
--gray-lt: #555
--radius:  8px
```
Fontes: **Playfair Display** (títulos) + **Inter** (corpo)

## Tags Analytics Instaladas
- **Google Analytics 4:** `G-5J4N177RQL`
- **Google Ads:** `AW-17974605756`
Ambas instaladas em todas as 6 páginas, logo após `<head>` (GA) e antes de `</head>` (Ads).

## Fluxo de Deploy
1. Editar os arquivos HTML nesta pasta
2. Copiar para o repositório git local (se necessário sincronizar)
3. `git add` + `git commit` + `git push origin main`
4. Vercel detecta o push e faz deploy automático (~1 min)

## Regras OAB (Provimento 205/2021) — OBRIGATÓRIO
- Linguagem **estritamente informativa e institucional**
- **PROIBIDO:** promessa de resultado, linguagem mercantilista, comparações com outros advogados, depoimentos de clientes, valores de honorários, sensacionalismo
- Sidebar de artigos: **apenas TOC** — sem card de WhatsApp/captação
- Não alterar cores, fontes ou identidade visual existente
- Não remover seções existentes
- Não alterar hrefs dos links de WhatsApp: `https://wa.me/5546999746391`

## Estrutura da index.html
- **Navbar** com logo e links de navegação
- **Hero** com subtítulo: *"Com especialização em Advocacia Criminal, o escritório também atua em Direito do Consumidor, Digital, Cível e Família em todo território nacional."*
- **Seção "Como posso ajudá-lo"** com 5 abas: Direito Penal | Consumidor | Digital & LGPD | Cível & Contratos | Família & Inventários
- **Seção Diferenciais**
- **Seção Conteúdo** (cards dos 4 artigos)
- **Seção Contato**
- **Footer** com OAB/PR 119.985

## Informações do Advogado
- **Nome:** Dr. Alisson Nascimento Paz
- **OAB:** OAB/PR 119.985
- **WhatsApp:** +55 46 99974-6391
- **Especialidade principal:** Advocacia Criminal
- **Atuação nacional**
