# Design System — FARMA-X v2.0

Documento normativo do design system da aplicação FARMA-X (WhatsApp Bulk
Messaging Platform). Extraído do código existente (v1, ad hoc) e reconstruído
para conformidade com a doutrina de marca do ECOSSISTEMA FUGIHARA
(`fugi-norma-ecossistema`) e com a decisão de unificação visual do ecossistema
aprovada pelo CEO em set/2026.

Versionado — qualquer mudança de token ou componente deve incrementar a versão
e registrar o motivo no changelog ao final deste documento.

---

## 1. O que existia antes (extração v1 — diagnóstico)

Inventário do que o código realmente usava antes desta reconstrução, mapeado
página a página (`Sidebar`, `Login`, `Dashboard`, `Contacts`, `Campaigns`,
`Templates`, `Reports`):

- **Cor de marca primária**: uma escala customizada `whatsapp` (`#25D366`,
  `#128C7E`, `#075E54`) aplicada em **tudo** — sidebar, botões primários,
  gradiente de login, spinners, foco de input, barras de progresso, texto de
  destaque.
- **Neutros**: escala `gray` padrão do Tailwind, sem alias.
- **Semântico/status**: cores ad hoc (`blue`, `green`, `yellow`, `emerald`,
  `red`, `purple`, `cyan`, `amber`, `orange`) escolhidas caso a caso, sem
  tabela central.
- **Tipografia**: fonte padrão do navegador (sem `font-family` declarada);
  escala de tamanho e peso usada de forma consistente por convenção
  (`text-xs` a `text-5xl`, `font-medium/semibold/bold`), mas nunca
  documentada.
- **Componentes implícitos**: `.btn-primary/secondary/danger`, `.card`,
  `.input`, `.badge` como classes utilitárias em `index.css` — sem variantes,
  tamanhos ou estados documentados.
- **Duplicação de dados de status**: `STATUS_COLORS`/`STATUS_LABELS` para
  campanha repetidos **identicamente** em `Dashboard.tsx` e `Campaigns.tsx`;
  `Templates.tsx` mantinha um terceiro mapa (`STATUS_CONFIG`) com chaves
  parcialmente diferentes. Três fontes de verdade para o mesmo conceito.

### Causa raiz do problema mais grave

A cor de marca primária do app inteiro era o verde oficial do **WhatsApp**
(`#25D366`), não uma cor do **FARMA-X**. Isso viola diretamente
`fugi-norma-ecossistema` §8.5 ("não usar cores fora da paleta aprovada") e
§8.2 (paleta azul unificada do ecossistema). A causa raiz é comum em projetos
que nascem de uma integração: o Tailwind foi configurado nomeando a cor pelo
**canal de entrega** ("whatsapp"), e essa cor de canal foi promovida, sem
decisão deliberada, a cor de **chrome de produto** — sidebar, CTA, foco,
métricas. Uma vez nomeada assim no `tailwind.config.ts`, toda página que
precisava de "a cor do sistema" naturalmente puxou `whatsapp-*`, espalhando o
erro por 7 arquivos.

---

## 2. Decisão de unificação do ecossistema (set/2026)

Aprovada pelo Sr. Fugi (CEO) diante do conflito entre o pedido de unificar
cores do ecossistema e a doutrina travada de `fugi-norma-ecossistema` §8.6
(ouro exclusivo da marca-mãe):

> Paleta de azuis única para marca-mãe + as 4 submarcas (mesmos 7 tons em
> todas). Tipografia IBM Plex Sans/Mono estendida a todas as submarcas
> (revoga a precedência Arial de §8.3 para peças novas). O dourado
> `#FCA311` permanece **exclusivo da marca-mãe**, usado apenas no selo de
> endosso.

Esta decisão está sendo formalizada em paralelo como proposta de atualização
de `fugi-norma-ecossistema` §8.2-8.4 (brand book do ecossistema, ativos e
logos das 4 submarcas) — pendente de aprovação final do Sr. Fugi antes de se
tornar doutrina travada. Este design system do FARMA-X já adota a decisão
porque ela é a única fonte de cor/tipografia consistente disponível hoje.

---

## 3. Tokens

### 3.1 Cor

| Token | Hex | Uso |
|---|---|---|
| `brand-900` | `#042C53` | Fundo dark (sidebar, hero), texto de máxima ênfase |
| `brand-700` | `#0C447C` | Botão primário, bordas em superfícies dark, hover de dark |
| `brand-500` | `#185FA5` | Ícones/chips de marca, barras de progresso, spinners |
| `brand-400` | `#378ADD` | Foco de input (ring), acentos secundários |
| `brand-300` | `#85B7EB` | Detalhes decorativos |
| `brand-200` | `#B5D4F4` | Texto secundário sobre fundo `brand-900` |
| `brand-50`  | `#E6F1FB` | Fundos suaves de destaque |

Regra: **não criar novos tons**. São os 7 hex homologados no ecossistema —
qualquer necessidade de um tom intermediário é sinal de que o componente
precisa de outra solução (opacidade, `gray`), não de uma cor nova.

| Token | Hex | Uso |
|---|---|---|
| `channel-500/600/700` | `#25D366` / `#128C7E` / `#075E54` | **Só** para indicadores que representam literalmente o canal WhatsApp (ex.: o chip do KPI "Mensagens Enviadas"/"Total Enviadas"). Nunca em chrome, navegação, botões, foco ou qualquer acento de marca. |
| `endorsement-gold` | `#FCA311` | Exclusivo do selo "parte do ECOSSISTEMA FUGIHARA". Só sobre fundo escuro. |
| `endorsement-bronze` | `#A15C05` | Mesmo selo, sobre fundo claro (regra de contraste da marca-mãe). |

Neutros: escala `gray` padrão do Tailwind (texto, bordas, fundos). Semântico
de status: ver §4.

### 3.2 Tipografia

- Família: **IBM Plex Sans** (corpo, UI) / **IBM Plex Mono** (identificadores
  técnicos — nome de template, código). Fallback `Arial, Helvetica,
  sans-serif` caso a fonte não carregue.
- Pesos em uso: 400 (texto corrido), 500 (rótulos/labels), 600 (títulos de
  card), 700/800 (títulos de página, números grandes de KPI).
- Escala (já em uso consistente no código, agora documentada):
  `text-xs` (12px, metadados) · `text-sm` (14px, corpo padrão de UI) ·
  `text-base` (16px) · `text-lg` (18px, título de modal) ·
  `text-2xl` (24px, título de página) · `text-4xl`/`text-5xl`
  (KPI em destaque).

### 3.3 Espaçamento, raio e sombra

- Espaçamento: escala padrão Tailwind (múltiplos de 4px), sem token custom.
- Raio: `rounded-lg` (8px) → controles (botão, input); `rounded-xl` (12px) →
  superfícies (`.card`); `rounded-2xl` (16px) → blocos de ênfase (ícone de
  logo/avatar); `rounded-full` → badge, avatar, paginação ativa.
- Sombra: `shadow-sm` em `.card`. Não há sombra dedicada para overlay/modal
  hoje (oportunidade de melhoria futura, não corrigida nesta versão para não
  ampliar o escopo desta extração).

---

## 4. Status semântico — fonte única

`src/design-system/status.ts` é a **única** fonte de rótulo + tom para status
de campanha e template. Consumido por `StatusBadge`
(`src/components/ui/StatusBadge.tsx`) em `Dashboard`, `Campaigns` e
`Templates` — eliminando os três mapas duplicados/divergentes do v1.

| Tom | Classe | Significado |
|---|---|---|
| `neutral` | `bg-gray-100 text-gray-700` | Rascunho, pendente |
| `muted` | `bg-gray-100 text-gray-500` | Cancelado |
| `info` | `bg-blue-100 text-blue-700` | Agendado, em análise |
| `success` | `bg-green-100 text-green-700` | Em execução, concluído, aprovado |
| `warning` | `bg-yellow-100 text-yellow-700` | Pausado |
| `danger` | `bg-red-100 text-red-700` | Falha, rejeitado |

Para adicionar um novo status: editar **só** `status.ts`. Nunca recriar um
mapa de cor local em uma página.

---

## 5. Componentes

Implementados como classes utilitárias em `@layer components` (`index.css`),
consistente com a abordagem Tailwind-first já usada no projeto — não foram
introduzidos componentes React genéricos (`<Button>`, `<Card>`) para não
adicionar uma camada de abstração que o código ainda não pedia.

| Classe | Uso | Variantes de estado |
|---|---|---|
| `.btn-primary` | Ação principal da tela | `disabled:opacity-50` |
| `.btn-secondary` | Ação secundária/cancelar | hover |
| `.btn-danger` | Ação destrutiva | hover |
| `.card` | Superfície de conteúdo | — |
| `.input` | Campo de formulário | `focus:ring-2 ring-brand-400` |
| `.badge` | Rótulo curto (status, tag, categoria) | usar com `StatusBadge` quando for status |

Componente React único adicionado: `StatusBadge` (label + tom + ícone
opcional), porque o problema que ele resolve (3 fontes de verdade
divergentes) é estrutural, não estético.

---

## 6. Regras de uso (do/don't)

- ✅ `brand-*` para todo chrome de produto: navegação, CTA, foco, ênfase de
  métrica genérica.
- ✅ `channel-*` (verde) só em indicadores que dizem explicitamente "isto é
  sobre o canal WhatsApp" (ex.: ícone do KPI "Mensagens Enviadas").
- ✅ `endorsement-gold`/`endorsement-bronze` só no selo de endosso da
  marca-mãe — se ele existir na UI do FARMA-X.
- ❌ Nunca introduzir um hex fora da tabela de tokens.
- ❌ Nunca recriar um mapa de status local — usar `design-system/status.ts`.
- ❌ Nunca usar `channel-*` como cor de marca (botão, sidebar, link).

---

## 7. Changelog

- **v2.0** (set/2026) — Reconstrução completa a partir da extração do código
  v1. Substituída a cor de marca primária (verde `whatsapp`, incorreta) pela
  paleta `brand` unificada do ecossistema (`fugi-norma-ecossistema` §8.2, com
  decisão de unificação do CEO estendendo-a à marca-mãe). Tipografia migrada
  de fonte padrão do navegador para IBM Plex Sans/Mono. Criada
  `design-system/status.ts` + `StatusBadge` para eliminar 3 mapas de status
  duplicados/divergentes (`Dashboard.tsx`, `Campaigns.tsx`, `Templates.tsx`).
  Reservada a escala `channel` (ex-`whatsapp`) exclusivamente para
  indicadores de canal. Adicionados tokens `endorsement-gold/bronze` para uso
  futuro do selo de endosso da marca-mãe.
- **v1** (implícito, não versionado) — estado original do código: cor de
  marca = verde WhatsApp, sem tokens documentados, status duplicado em 3
  arquivos.
