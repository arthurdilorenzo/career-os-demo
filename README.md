# Career OS — Painel Interativo de Processos Seletivos

Painel pessoal e template open-source para gestão de processos seletivos e oportunidades de carreira (Engenharia, Produto, Dados, Cloud, Marketing, Operações, Finanças e Negócios), desenvolvido em **HTML, CSS e JavaScript puro (zero build / offline-first)** com gráficos em SVG inline e persistência local no navegador.

- **Demo ao vivo:** https://arthurdilorenzo.github.io/career-os-demo/
- **Licença:** [MIT](LICENSE)

> **Nota sobre privacidade dos dados:** Esta demo pública utiliza **100% de dados fictícios** em `data.js` (48 registros demonstrativos de um perfil sintético — `John Doe`). Nenhuma empresa, contato, pretensão ou histórico real está incluído no repositório.

## Principais Recursos

- **Visão Geral (Command Center):** KPIs com linhas de luz e micro-gráficos SVG, fila de prazos e próximas ações, cards de processos em andamento e visão rápida de funil e volume mensal.
- **Agenda:** Agrupamento automático por urgência (`Atrasadas`, `Hoje`, `Próximos 7 dias` e posteriores) com atalho `+3d` para reagendar follow-ups.
- **Análises:** Gráficos SVG nativos (gauge semi-circular de taxa de retorno real, donut USD/BRL, distribuição de Fit Score, gráfico mensal agrupado por região e desfecho das candidaturas).
- **Kanban por Etapa:** 8 colunas (`A validar`, `A aplicar`, `Enviadas`, `Triagem`, `Entrevista`, `Oferta`, `Encerradas`, `Rejeitadas`) com drag-and-drop entre estágios, filtros por moeda e busca global (`⌘K` / `Ctrl+K`).
- **Tabela:** Base pesquisável, filtros rápidos por etapa/moeda e ordenação por coluna com cabeçalho fixo.
- **Gaveta Lateral (`Drawer`):** Edição rápida de estágio por stepper, prioridade, datas, notas, ações rápidas contextuais e exportação das alterações salvas em `localStorage` via JSON.
- **Modo Privacidade:** Oculta valores financeiros com blur (`kanban_blurred.html` ou botão na sidebar).

## Como usar e personalizar

### 1. Testar direto no navegador (sem código)
1. Baixe ou clone este repositório e abra `index.html` diretamente no navegador (funciona via `file://`, sem Node, bundler ou servidor).
2. Use **`+ Nova vaga`** e a gaveta lateral para simular seu próprio fluxo (as alterações ficam salvas no `localStorage` do seu navegador) e clique em **Alterações** para exportar tudo em JSON.

### 2. Adaptar como seu painel pessoal
- **Nome, iniciais e metas financeiras:** edite `index.html` nos blocos `.sb-brand` (`JD` / `John Doe`) e `.tb-targets` (`US$ 5k+` / `R$ 15k+`), além dos favicons em `assets/`.
- **Sua base de vagas (`data.js`):** substitua os objetos dentro de `window.pipelineData = [...]` seguindo o schema abaixo:

```js
{
  "id": "empresa-cargo-2026",
  "company": "Empresa Exemplo",
  "role": "Senior Backend Engineer",
  "category": "Internacional", // "Internacional" | "Brasil"
  "currency": "USD",           // "USD" | "BRL"
  "salaryText": "US$ 5.000 – US$ 6.500 / mês",
  "salaryMin": 5000,
  "salaryMax": 6500,
  "workModel": "100% Remoto",
  "location": "Remoto",
  "stage": "interview",        // inbound | to_apply | submitted | screening | interview | offer | closed | rejected
  "fitScore": 9.2,
  "priority": "high",          // high | normal | low
  "appliedDate": "2026-11-01",
  "dueDate": "2026-11-20",
  "nextAction": "Enviar confirmação de horário",
  "url": "https://...",
  "notes": "Observações sobre escopo e entrevistas.",
  "tags": ["Remoto", "Backend"]
}
```

### 3. Publicar no GitHub Pages
1. Faça fork ou suba esta pasta para um repositório no GitHub (`branch: main`).
2. Acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch** → branch `main` → pasta `/ (root)` e clique em **Save**.

## Contribuições

Sugestões e Pull Requests são bem-vindos — por exemplo:
- Importação de CSV/JSON direto pela interface;
- Tema claro (*Light Mode*) opcional com toggle;
- Filtros salvos e exportação de relatório semanal.
