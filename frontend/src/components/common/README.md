# Componentes Comuns - Design System CRM

Este diretório contém componentes reutilizáveis baseados no padrão de design do MedicosDisparo, utilizando Material-UI com gradientes e efeitos modernos.

## Componentes Disponíveis

### 1. StyledCard
Card estilizado com gradientes e efeitos hover.

```jsx
import { StyledCard } from '../components/common';

<StyledCard hover={true} gradient="linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)">
  <CardContent>
    Conteúdo do card
  </CardContent>
</StyledCard>
```

### 2. GradientButton
Botões com gradientes personalizáveis e variações pré-definidas.

```jsx
import { GradientButton, PrimaryGradientButton, SuccessGradientButton } from '../components/common';

<PrimaryGradientButton>Botão Primário</PrimaryGradientButton>
<SuccessGradientButton>Botão de Sucesso</SuccessGradientButton>
```

### 3. PageHeader
Cabeçalho de página com título, ícone e botão de ação.

```jsx
import { PageHeader } from '../components/common';
import { People as PeopleIcon, Add as AddIcon } from '@mui/icons-material';

<PageHeader
  title="Clientes"
  icon={PeopleIcon}
  actionButton={{
    text: "Novo Cliente",
    to: "/clientes/novo",
    icon: <AddIcon />
  }}
/>
```

### 4. FilterPanel
Painel de filtros expansível com campos personalizáveis.

```jsx
import { FilterPanel } from '../components/common';

<FilterPanel
  open={showFilters}
  title="Filtros"
  filters={[
    {
      type: 'select',
      label: 'Tipo',
      value: filtroTipo,
      onChange: (e) => setFiltroTipo(e.target.value),
      options: [{ value: 'empresa', label: 'Empresa' }]
    },
    {
      type: 'text',
      label: 'Cidade',
      value: filtroCidade,
      onChange: (e) => setFiltroCidade(e.target.value),
      placeholder: 'Digite a cidade'
    }
  ]}
  onClear={limparFiltros}
  onApply={aplicarFiltros}
/>
```

### 5. StyledPagination
Componente de paginação estilizado.

```jsx
import { StyledPagination } from '../components/common';

<StyledPagination
  currentPage={paginacao.paginaAtual}
  totalPages={paginacao.totalPaginas}
  onPageChange={mudarPagina}
/>
```

### 6. LoadingState
Estado de carregamento com spinner.

```jsx
import { LoadingState } from '../components/common';

<LoadingState message="Carregando clientes..." />
```

### 7. ErrorState
Estado de erro com botão de retry.

```jsx
import { ErrorState } from '../components/common';

<ErrorState
  message="Erro ao carregar clientes"
  onRetry={carregarClientes}
  retryText="Tentar Novamente"
/>
```

### 8. EmptyState
Estado vazio com ação opcional.

```jsx
import { EmptyState } from '../components/common';
import { People as PeopleIcon, Add as AddIcon } from '@mui/icons-material';

<EmptyState
  title="Nenhum cliente encontrado"
  message="Comece adicionando seu primeiro cliente."
  icon={PeopleIcon}
  actionButton={{
    text: "Adicionar Cliente",
    to: "/clientes/novo",
    icon: <AddIcon />
  }}
/>
```

## Padrão de Design

Todos os componentes seguem o padrão estabelecido pelo MedicosDisparo:

- **Gradientes**: Uso extensivo de gradientes lineares para backgrounds e botões
- **Bordas arredondadas**: `borderRadius: 3` para cards e `borderRadius: 2` para botões
- **Sombras**: `boxShadow: '0 4px 20px rgba(0,0,0,0.1)'` para elevação
- **Efeitos hover**: Transformações e mudanças de sombra em hover
- **Cores**: Paleta baseada em Material-UI com gradientes personalizados
- **Tipografia**: Uso consistente das variantes do Material-UI

## Como Usar

1. Importe os componentes necessários:
```jsx
import { StyledCard, GradientButton, PageHeader } from '../components/common';
```

2. Use os componentes em suas páginas seguindo os exemplos acima.

3. Personalize através das props `sx` quando necessário, mantendo a consistência visual.