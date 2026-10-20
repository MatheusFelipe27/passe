# Passe

Gestão de uma liga fictícia de futebol: cadastro de jogadores, clubes, compra e venda com contrato de fidelidade, histórico de transações com exportação em CSV, escalação, partidas decididas por duelos entre os titulares e classificação.

| O quê | Endereço |
| --- | --- |
| Origem da API (o script da banca acrescenta `/api/v1`) | `http://localhost:3000` |
| Interface | `http://localhost:5173` |
| Documentação interativa da API (Swagger) | `http://localhost:3000/api/docs` |

O repositório tem duas pastas: `backend/` (API REST em NestJS) e `frontend/` (interface em React com Vite).

## 1. Pré-requisitos

| Ferramenta | Versão |
| --- | --- |
| Node.js, com npm | 22 LTS (22.12 ou mais recente; testado com 22.14) |
| Docker Engine, com Docker Compose v2 | 24 ou mais recente |
| PostgreSQL | 16, pela imagem oficial `postgres:16-alpine`, iniciada pelo Docker Compose (não precisa instalar) |
| Git | qualquer |

## 2. Banco de dados

O banco é criado pelas migrations do Prisma, versionadas em `backend/prisma/migrations`. Ele começa vazio: sem jogadores, clubes, transações nem partidas. Não há carga de dados de exemplo.

**Criar** (na primeira vez):

```bash
# Na raiz do repositório: sobe o PostgreSQL e espera ele ficar pronto
docker compose up -d --wait db

# Na pasta backend (depois do npm ci da seção 3): cria as tabelas
cd backend
npx prisma migrate deploy
```

**Recriar do zero** (apaga todos os dados e cria as tabelas de novo):

```bash
# Na raiz do repositório
docker compose down -v
docker compose up -d --wait db

# Na pasta backend
cd backend
npx prisma migrate deploy
```

## 3. Instalar e executar (Ubuntu 24.04)

Um comando por linha, na ordem. Os arquivos de trava de dependências estão versionados: `backend/package-lock.json` e `frontend/package-lock.json`.

```bash
# Banco de dados (na raiz do repositório)
docker compose up -d --wait db

# Backend (na pasta backend)
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run dev
# API em http://localhost:3000 (o script da banca acrescenta /api/v1)

# Frontend (em outro terminal, a partir da raiz do repositório)
cd frontend
npm ci
npm run dev
# Interface em http://localhost:5173
```

### 3.1 Tudo com Docker, num único comando

Na raiz do repositório:

```bash
docker compose up --build
```

Sobe o banco, a API em `http://localhost:3000` e a interface em `http://localhost:5173`. A API aplica as migrations ao iniciar, então o banco já fica pronto. Para recriar o banco do zero por esse caminho: `docker compose down -v` e, de novo, `docker compose up --build`.

Os dois caminhos usam as mesmas portas: use um ou o outro.

## 4. Variáveis de ambiente

**Backend** (`backend/.env`, a partir de `backend/.env.example`):

| Variável | Para quê | Valor do exemplo |
| --- | --- | --- |
| `DATABASE_URL` | conexão com o PostgreSQL | `postgresql://passe:passe@localhost:5432/passe?schema=public` |
| `PORT` | porta da API | `3000` |
| `CORS_ORIGIN` | origem da interface liberada no CORS | `http://localhost:5173` |
| `TEST_DATABASE_URL` | banco separado, usado só pelos testes de integração (apagado e recriado a cada execução) | `postgresql://passe:passe@localhost:5432/passe_test?schema=public` |

**Frontend** (opcional; `frontend/.env`, a partir de `frontend/.env.example`):

| Variável | Para quê | Valor padrão |
| --- | --- | --- |
| `VITE_API_URL` | endereço da API, com o prefixo `/api/v1` | `http://localhost:3000/api/v1` (usado quando não há `.env`) |

No Docker Compose, os mesmos valores estão no `docker-compose.yml`.

## 5. Testes, lint, formatação, documentação e logs

| O quê | Pasta | Comando |
| --- | --- | --- |
| Testes do backend (unitários, sem banco; inclui o valor de mercado, RN02 a RN05) | `backend` | `npm test` |
| Testes de integração do backend (precisam do banco no ar e do `.env`) | `backend` | `npm run test:integration` |
| Lint do backend | `backend` | `npm run lint` |
| Verificação da formatação do backend (só verifica, não altera) | `backend` | `npm run format:check` |
| Testes do frontend (componentes, com Vitest e Testing Library) | `frontend` | `npm test` |
| Lint do frontend | `frontend` | `npm run lint` |
| Verificação da formatação do frontend (só verifica, não altera) | `frontend` | `npm run format:check` |

Todos terminam sozinhos, sem modo de observação. Os testes precisam do `npm ci` da pasta.

**Documentação interativa:** com a API no ar, `http://localhost:3000/api/docs` (Swagger), com todos os endpoints.

**Logs:** cada requisição gera uma linha na saída da API, pelo logger do NestJS, com data e hora, método, caminho e status. O formato da data segue o idioma do sistema. Exemplo, num sistema em português:

```text
[Nest] 12345  - 20/10/2026, 10:15:03     LOG [HTTP] GET /api/v1/players 200
```

## 6. Estrutura de pastas

```text
backend/
├── prisma/                schema.prisma (7 tabelas, nomes em português) e migrations
└── src/
    ├── main.ts            prefixo /api/v1, CORS, Swagger
    ├── config/            validação das variáveis de ambiente
    ├── prisma/            conexão e execução de operações em transação
    ├── common/            filtro central de erros, validação, dinheiro, texto, datas e log por requisição
    └── modules/           um módulo por assunto: players, clubs, market, lineups e matches
        └── <módulo>/      controller → service → repository; domain/ com as regras puras; dto/ com os schemas

frontend/
└── src/
    ├── api/               cliente HTTP e funções de cada recurso (a única camada que fala com a API)
    ├── hooks/             consultas e ações com TanStack Query
    ├── app/               rotas
    ├── components/        componentes compartilhados (tabela com estados, campo de formulário, avisos, layout) e ui/ (shadcn)
    ├── features/          telas por assunto: players, clubs, market, league, home e not-found
    ├── lib/               formatação de moeda e data, avisos
    └── test/              utilitários dos testes
```

## 7. Bibliotecas

Além da stack obrigatória (NestJS com TypeScript, PostgreSQL, React com Vite).

**Backend**

| Biblioteca | Motivo |
| --- | --- |
| Prisma (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`) | ORM com migrations versionadas e consultas parametrizadas; o adapter `pg` liga o Prisma 7 ao PostgreSQL |
| Zod | valida o corpo e os query params por schema, com tipos estritos (`"15"` não vira número) |
| decimal.js | contas de dinheiro sem erro de ponto flutuante, com o arredondamento das regras |
| `@nestjs/config` e dotenv | leitura e validação das variáveis de ambiente |
| `@nestjs/swagger` | documentação interativa da API |
| Jest, ts-jest, Supertest e `@nestjs/testing` | testes unitários e de integração |
| ESLint, typescript-eslint e Prettier | lint e formatação |

**Frontend**

| Biblioteca | Motivo |
| --- | --- |
| React Router (modo biblioteca) | rotas das telas |
| TanStack Query | consultas com estados de carregamento e erro, e a tela atualizada depois de cada ação, sem recarregar |
| React Hook Form, Zod e `@hookform/resolvers` | validação dos formulários antes de enviar, com a mensagem junto ao campo |
| Tailwind CSS, shadcn/ui (Radix, class-variance-authority, cn, tw-animate-css) | estilo e componentes acessíveis, no sistema de design do mockup |
| lucide-react | ícones |
| sonner | avisos de sucesso e de erro |
| Fontes Geist (`@fontsource-variable`) | a fonte do mockup, sem depender de serviço externo |
| Vitest, Testing Library e jsdom | testes de componentes |
| ESLint, typescript-eslint e Prettier | lint e formatação |

## 8. Decisões e premissas

- **Mensagens de erro em português.** Toda recusa responde `{ "message": "..." }`. Quando o erro é de um campo só, a mensagem vem como `campo: mensagem` (por exemplo, `name: deve ter de 3 a 100 caracteres`), e a interface mostra o erro junto ao campo.
- **Ordem das conferências.** Formato do pedido (400), depois existência dos recursos (404), depois regras de negócio (409). Nada é gravado numa recusa.
- **Operações concorrentes.** Compra, venda, escalação e alteração de condição rodam numa transação e travam as linhas que alteram até o fim dela: primeiro o jogador e depois o clube, quando há clube, sempre nessa ordem, para duas operações não se atropelarem. A partida e a classificação leem o banco num único instante (`REPEATABLE READ`).
- **Limite de 20 clubes.** As criações de clube são feitas uma de cada vez, para duas criações simultâneas não passarem do limite.
- **"Agora" de cada operação.** A data e a hora do servidor são lidas uma vez por operação e usadas em todas as contas dela (fidelidade, dias restantes e data gravada).
- **Interface para desktop.** A interface foi desenhada para a janela de 1366 × 768 em que a banca a usa. A responsividade em 375 px, diferencial opcional, não foi feita.
- **Variação do caixa com sinal tipográfico.** Os valores negativos aparecem com o sinal "−" (U+2212), que tem a largura do "+". O CSV mantém o "-" da RN18.
- **Escalação na interface.** Cada vaga só oferece os jogadores do elenco daquela posição, sem `DOENTE` e sem quem já está em outra vaga (o enunciado permite impedir essas escolhas). Clube que nunca escalou começa na formação 2-1-1, com as vagas vazias.
- **Filtros na URL.** Os filtros das listas ficam na URL, com os nomes dos query params da API, para sobreviverem ao "voltar" e ao recarregar.
- **Extras do mockup.** Também foram feitos a tela inicial, os contadores do menu, a última partida e as últimas partidas na classificação, que o enunciado deixa opcionais.

## 9. Funcionalidades não implementadas

Nenhuma: todas as funcionalidades obrigatórias do backend e do frontend foram implementadas.

## 10. Uso de inteligência artificial

- **Ferramenta:** Claude Code (Anthropic), como apoio no desenvolvimento.
- **Onde:** no backend e no frontend, na escrita de código, de testes e de features, e na conferência das regras do enunciado e do barema.
- **Como e por quê:** para ganhar agilidade. Trabalhei por etapas: para cada funcionalidade, defini o que seria feito, revisei o código e os testes, e testei na API (Swagger) e na tela antes de cada commit.
- **O que aceitei, alterei ou descartei:** aceitei o que passou na minha revisão e nos testes. Alterei o que não batia com o enunciado, com o mockup ou com o que eu queria para a interface (por exemplo, o erro de nome repetido junto ao campo, a rolagem da lista de clubes na barra lateral e os ícones do campo da partida). Descartei sugestões que não acrescentavam ao projeto.
