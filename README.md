# Sistema ERP/CMMS - Gestão de Calibração

Sistema completo de gerenciamento de calibrações de equipamentos industriais, com dashboard analítico, RBAC granular, upload de certificados PDF, controle de estoque e cálculo automático de vencimentos.

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Estilo | Tailwind CSS, shadcn/ui, Radix, lucide-react |
| Gráficos | Recharts |
| Auth | Firebase Auth (Email/Senha) + Admin SDK |
| Banco | PostgreSQL (Neon) + Prisma ORM |
| Armazenamento | Cloudflare R2 (certificados PDF) |
| Tema | next-themes (claro/escuro/sistema) |
| Utils | `xlsx` (Excel), `docx` (Word), `sonner` (Toasts) |

## ✅ Funcionalidades

### Páginas Frontend
- **Dashboard** — Cards de status, 4 gráficos Recharts, widget saúde dos setores, filtro por setor, tabela de próximos vencimentos.
- **Equipamentos (Em Uso)** — Tabela com filtros (status/setor/tipo), busca, paginação, **Importação (Excel)**, **Exportação (PDF/Excel/Word)**, **Etiquetas QR Code** e ação de **Mover para Estoque**.
- **Estoque (Novo 📦)** — Gestão de equipamentos fora de uso, com controle de localização física e ação de **Mover para Uso**.
- **Equipamento Detalhe** — Informações completas, edição inline, badge de status, histórico e timeline.
- **Calibrações** — Histórico timeline, formulário de nova calibração, upload/download PDF via R2.
- **Calendário** — Visualização de vencimentos em formato de calendário.
- **Programações (Kanban)** — Gestão visual de ordens de serviço e status.
- **Setores** — CRUD em cards + tabela de equipamentos do setor.
- **Tipos de Equipamento** — CRUD com modal.
- **Regras de Calibração** — CRUD com periodicidade e janela de aviso.
- **Admin Usuários** — Tabs (Pendentes/Ativos/Bloqueados), aprovação, edição de role/setor.
- **Auditoria** — Logs de ações críticas do sistema.
- **Configurações** — Perfil, seletor de tema, info do sistema.
- **Notificações** — Feedback visual via Toasts (Sonner) para todas as ações.

### APIs (Principais)
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `/api/auth/sync-user` | POST | Sincroniza usuário Firebase-DB |
| `/api/equipment` | GET, POST | Filtros avançados + `usageStatus` |
| `/api/equipment/[id]` | GET, PATCH, DELETE | Gestão individual |
| `/api/equipment/import` | POST | Importação em massa via Excel |
| `/api/dashboard` | GET | KPIs e estatísticas |
| `/api/r2/presign` | POST | URLs seguras para upload |
| `/api/admin/users` | GET, PATCH | Gestão de usuários |

## 👥 Roles e Permissões (RBAC)

| Role | Permissões |
|------|-----------|
| **CRIADOR** | Superadmin imutável (acesso total) |
| **ADMIN** | Editar equipamentos, setores, regras, usuários |
| **QUALIDADE** | Ver todos setores + registrar calibrações |
| **PRODUCAO** | Visão restrita ao próprio setor |
| **VIEWER** | Dashboard somente leitura |

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL ([Neon](https://neon.tech) gratuito)
- Projeto Firebase com Email/Password habilitado
- Cloudflare R2 (para upload de certificados PDF)

## ⚙️ Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar .env.example → .env e preencher

# 3. Banco de dados
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed   # Popula com dados iniciais (setores, tipos, etc.)

# 4. Rodar
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📊 Fluxo de Trabalho

1. **Cadastro**: Usuário se registra e fica com status **PENDING**.
2. **Aprovação**: Admin/Criador aprova e define Nível de Acesso (Role) e Setor.
3. **Uso**:
    - **Equipamentos**: Cadastro, Calibração, Movimentação entre Setores/Estoque.
    - **Estoque**: Armazenamento temporário com localização.
    - **Calibração**: Controle de vencimentos e certificados.

## 📁 Estrutura do Projeto

```
app/
├── (app)/                    # Rotas autenticadas (layout com sidebar)
│   ├── dashboard/
│   ├── equipamentos/         # Lista de equipamentos em uso
│   ├── estoque/              # Lista de equipamentos em estoque
│   ├── setores/
│   ├── admin/
│   └── ...
├── api/                      # API Routes (Next.js)
components/                   # Componentes Shadcn/UI e customizados
lib/                          # Utilitários (Auth, DB, S3, Cálculos)
prisma/                       # Schema e Seeds
public/                       # Assets estáticos
```

---

**Desenvolvido com Next.js 16, Prisma, Firebase Auth e Cloudflare R2**
