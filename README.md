<div align="center">

<img src="frontend/src/assets/logo.png" alt="BusConnect" width="120" />

# BusConnect

**Plataforma de fretamento de ônibus que conecta clientes a empresas de transporte.**

Clientes encontram veículos e solicitam viagens. Empresas gerenciam frota, motoristas e solicitações. A administração aprova empresas e acompanha a receita da plataforma.

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

---

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Screenshots](#screenshots)
- [Arquitetura e tecnologias](#arquitetura-e-tecnologias)
- [Como executar](#como-executar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Regras de negócio](#regras-de-negócio)
- [API](#api)
- [Modelo de dados](#modelo-de-dados)

---

## Visão geral

O BusConnect centraliza o processo de fretamento de ônibus em um único sistema, com quatro perfis de acesso:

| Perfil | Quem é | O que faz |
| --- | --- | --- |
| **Administrador** | Equipe BusConnect | Aprova, recusa e bloqueia empresas; acompanha usuários, viagens, receita e comissão |
| **Empresa (gestor)** | Dono da transportadora | Gerencia perfil, veículos, motoristas, funcionários, solicitações e viagens |
| **Funcionário** | Colaborador da empresa | Acessa o próprio perfil e os dados da empresa à qual está vinculado |
| **Cliente** | Quem contrata o frete | Navega no catálogo, solicita viagens e acompanha o status |

## Funcionalidades

### Cliente
- Catálogo de ônibus de empresas aprovadas, com busca por empresa, modelo ou cidade
- Solicitação de viagem com origem, destino, data, horário, passageiros e distância
- **Valor estimado em tempo real** (preço por km × distância)
- Aviso das **datas já reservadas** do veículo, que evita conflito de agenda
- Acompanhamento das solicitações (pendente, aceita, recusada ou cancelada) e das viagens

### Empresa
- Cadastro com **validação de CNPJ** (dígitos verificadores) e aprovação pelo administrador
- Gestão de **veículos** (placa, modelo, ano, capacidade, preço/km) e **motoristas** (CPF, CNH e categoria)
- Caixa de **solicitações recebidas** com aceite ou recusa
- Ao aceitar, vincula veículo e motorista e vê o detalhamento do valor: total pago pelo cliente, comissão BusConnect e valor líquido
- Gestão de viagens: agendada, em andamento, concluída ou cancelada

### Administrador
- Painel com indicadores: clientes, funcionários, empresas (pendentes e aprovadas), viagens, receita total e comissão
- Fila de **aprovações pendentes** de empresas
- Listagem e bloqueio de empresas, além da visão de usuários e viagens

### Geral
- **Notificações** para eventos importantes: nova solicitação, aceite ou recusa, empresa aprovada ou bloqueada, viagem confirmada ou cancelada
- Autenticação por token (Bearer) e roteamento de telas por perfil
- Validação de formulários no cliente, incluindo indicador de força de senha

## Screenshots

As imagens ficam em [`docs/screenshots`](docs/screenshots).

### Acesso

| Login | Cadastro de empresa |
| :---: | :---: |
| ![Login](docs/screenshots/01-login.png) | ![Cadastro de empresa](docs/screenshots/02-cadastro-empresa.png) |

### Administrador

| Visão geral | Empresas |
| :---: | :---: |
| ![Visão geral do admin](docs/screenshots/03-admin-visao-geral.png) | ![Empresas](docs/screenshots/04-admin-empresas.png) |
| **Viagens** | **Relatório** |
| ![Viagens do admin](docs/screenshots/05-admin-viagens.png) | ![Relatório](docs/screenshots/06-admin-relatorio.png) |

### Empresa

| Perfil | Veículos |
| :---: | :---: |
| ![Perfil da empresa](docs/screenshots/07-empresa-perfil.png) | ![Veículos](docs/screenshots/08-empresa-veiculos.png) |
| **Solicitações recebidas** | **Aceitar solicitação** |
| ![Solicitações](docs/screenshots/09-empresa-solicitacoes.png) | ![Aceitar solicitação](docs/screenshots/10-empresa-aceitar-solicitacao.png) |
| **Viagens** | |
| ![Viagens da empresa](docs/screenshots/11-empresa-viagens.png) | |

### Cliente

| Catálogo | Solicitar viagem |
| :---: | :---: |
| ![Catálogo](docs/screenshots/12-cliente-catalogo.png) | ![Solicitar viagem](docs/screenshots/13-cliente-solicitar.png) |
| **Minhas solicitações** | **Minhas viagens** |
| ![Minhas solicitações](docs/screenshots/14-cliente-solicitacoes.png) | ![Minhas viagens](docs/screenshots/15-cliente-viagens.png) |

### Notificações

<p align="center">
  <img src="docs/screenshots/16-notificacoes.png" alt="Notificações" width="70%" />
</p>

## Arquitetura e tecnologias

```
┌──────────────────────┐      HTTP/JSON       ┌──────────────────────┐        ┌──────────────┐
│  Frontend (SPA)      │ ───────────────────▶ │  Backend (API REST)  │ ─────▶ │  PostgreSQL  │
│  React + MUI + Vite  │   Bearer token       │  Laravel 13 / PHP 8.3│        │      15      │
│  Nginx  :5173        │ ◀─────────────────── │  :8000/api           │        │    :5433     │
└──────────────────────┘                      └──────────────────────┘        └──────────────┘
```

| Camada | Tecnologias |
| --- | --- |
| **Frontend** | React 19, Material UI 9, Emotion, Vite 8, ESLint |
| **Backend** | Laravel 13, PHP 8.3, Eloquent ORM, Laravel Sanctum |
| **Banco de dados** | PostgreSQL 15 |
| **Infraestrutura** | Docker, Docker Compose, Nginx (build de produção do frontend) |

## Como executar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose v2
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/JoaohCalza/busconnect-platform.git
cd busconnect-platform
```

### 2. Configurar o backend

Crie o `.env` a partir do exemplo:

```bash
cp backend/.env.example backend/.env
```

Ajuste a conexão com o banco no `backend/.env` para usar o container do Postgres:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=bus_connect
DB_USERNAME=postgres
DB_PASSWORD=masterkey
```

Instale as dependências PHP e gere a chave da aplicação:

```bash
docker compose build backend
docker compose run --rm --no-deps backend sh -c "composer install && php artisan key:generate"
```

> O `docker-compose.yml` monta `./backend` dentro do container. Por isso a pasta `backend/vendor` precisa existir localmente, e esse é o motivo do `composer install` acima.

### 3. Subir os containers

```bash
docker compose up -d --build
```

As migrations rodam automaticamente quando o backend sobe.

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api |
| PostgreSQL | `localhost:5433` (usuário `postgres` / senha `masterkey`) |

### 4. Criar o usuário administrador

Clientes e empresas se cadastram pela tela de login. O administrador é criado pelo terminal:

```bash
docker compose exec backend php artisan tinker --execute="App\Models\User::create(['name' => 'Administrador', 'email' => 'admin@busconnect.com', 'password' => 'Admin@123', 'account_type' => 'ADMIN']);"
```

### Modo desenvolvimento (hot reload)

O arquivo `docker-compose.dev.yml` roda o frontend com o servidor de desenvolvimento do Vite e instala as dependências do backend ao subir:

```bash
docker compose -f docker-compose.dev.yml up
```

### Comandos úteis

```bash
docker compose logs -f backend                       # logs da API
docker compose exec backend php artisan migrate      # rodar migrations
docker compose exec backend php artisan test         # testes do backend
docker compose down                                  # parar os containers
docker compose down -v                               # parar e apagar o banco
```

## Estrutura do projeto

```
busconnect-platform/
├── backend/                     # API REST em Laravel
│   ├── app/
│   │   ├── Http/Controllers/    # Auth, Users, Companies, Vehicles, Drivers, TripRequests, Trips
│   │   └── Models/              # User, Company, Vehicle, Driver, TripRequest, Trip, Notification
│   ├── database/migrations/     # Esquema do banco
│   ├── routes/api.php           # Rotas da API
│   └── Dockerfile
├── frontend/                    # SPA em React
│   ├── src/
│   │   ├── screens/             # Login e dashboards por perfil
│   │   │   ├── client/          # Catálogo, solicitações e viagens do cliente
│   │   │   └── company/         # Veículos, motoristas, solicitações e viagens da empresa
│   │   ├── components/ui/       # Navbar, campos e ícones reutilizáveis
│   │   ├── services/api.js      # Cliente HTTP da API
│   │   └── theme/               # Tema do Material UI
│   └── Dockerfile               # Build com Node e servidor Nginx
├── docs/screenshots/            # Capturas de tela usadas neste README
├── docker-compose.yml           # Ambiente padrão (frontend em Nginx)
└── docker-compose.dev.yml       # Ambiente de desenvolvimento (Vite com hot reload)
```

## Regras de negócio

**Ciclo de vida da empresa.** Toda empresa cadastrada começa como *pendente* e só aparece no catálogo depois de aprovada pelo administrador.

| Código (`companies.active`) | Status |
| :---: | --- |
| `1` | Pendente de aprovação |
| `2` | Recusada |
| `3` | Aprovada (visível no catálogo) |
| `4` | Bloqueada (login dos usuários da empresa é negado) |

**Fluxo de uma viagem**

```
Cliente solicita ──▶ Solicitação "pending" ──▶ Empresa aceita ──▶ Viagem "scheduled" ──▶ "in_progress" ──▶ "completed"
                                          └──▶ Empresa recusa ("rejected")      └──▶ "cancelled"
```

**Preço e comissão.** Quando a empresa aceita uma solicitação com veículo vinculado, o sistema calcula:

```
valor total   = preço por km do veículo × distância (km)    → pago pelo cliente
comissão      = 10% do valor total                          → BusConnect
valor líquido = valor total − comissão                      → empresa
```

**Disponibilidade.** Um veículo não pode receber duas viagens confirmadas na mesma data. O cliente vê as datas já reservadas antes de enviar a solicitação.

## API

Base URL: `http://localhost:8000/api`. As rotas autenticadas usam o cabeçalho `Authorization: Bearer <token>`, com o token retornado no login.

| Recurso | Endpoints |
| --- | --- |
| **Autenticação** | `POST /auth/login` · `POST /auth/register` · `POST /auth/logout` · `GET /auth/me` |
| **Perfil** | `GET /user/profile` · `PUT /user/profile` |
| **Usuários** | `POST /users` · `GET /users/company/{company_id}` · `GET/PUT/DELETE /users/{id}` |
| **Empresas** | `GET/PUT /companies/{id}` |
| **Veículos** | `GET /vehicles` · `GET /vehicles/{id}/unavailable-dates` · `POST /vehicles` · `GET/PUT/DELETE /vehicles/{id}` |
| **Motoristas** | `GET /drivers?company_id=` · `POST /drivers` · `GET/PUT/DELETE /drivers/{id}` |
| **Solicitações** | `GET /trip-requests` · `POST /trip-requests` · `GET/DELETE /trip-requests/{id}` · `PUT /trip-requests/{id}/status` |
| **Viagens** | `GET /trips` · `POST /trips` · `GET/PUT/DELETE /trips/{id}` |
| **Administração** | `GET /admin/users` · `GET /admin/companies` · `PUT /admin/companies/{id}/approve` · `PUT /admin/companies/{id}/reject` · `DELETE /admin/companies/{id}` |
| **Notificações** | `GET /notifications?user_id=` · `PUT /notifications/{id}/read` |

## Modelo de dados

```
companies ──< users              (gestor e funcionários da empresa)
companies ──< vehicles
companies ──< drivers
users (cliente) ──< trip_requests >── companies, vehicles
trip_requests ──○ trips >── vehicles, drivers   (preço e comissão)
users ──< notifications
```

| Tabela | Principais campos |
| --- | --- |
| `users` | nome, e-mail, senha, CPF, telefone, `account_type` (`CLIENTE`, `EMPRESA_ADMIN`, `FUNCIONARIO`, `ADMIN`), `company_id` |
| `companies` | nome, CNPJ, contato, endereço, `active` (status) |
| `vehicles` | placa, marca, modelo, ano, capacidade, `price_per_km`, ativo |
| `drivers` | nome, CPF, CNH, categoria da CNH, contato, ativo |
| `trip_requests` | origem, destino, data e horário de saída, passageiros, `distance_km`, status |
| `trips` | datas, veículo, motorista, `price`, `commission`, status |
| `notifications` | usuário, tipo, mensagem, lida |

---

<div align="center">

Desenvolvido por <a href="https://github.com/JoaohCalza">JoaohCalza</a>

</div>
