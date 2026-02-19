# Gestão de Calibração — Task List & Roadmap

> Estado atual do desenvolvimento e próximos passos.

---

## 1. Stack & Infraestrutura
- [x] Next.js App Router + TypeScript
- [x] Prisma ORM + PostgreSQL Neon
- [x] Tailwind CSS
- [x] shadcn/ui + Radix + lucide-react
- [x] Firebase Auth (Email/Senha) — Admin SDK + Client SDK
- [x] Cloudflare R2 — upload/download PDFs de certificados
- [x] Tema claro + escuro (next-themes)
- [x] `sonner` para notificações (Toasts)
- [x] `xlsx` e `docx` para importação/exportação

---

## 2. Banco de Dados — Schema Prisma
- [x] Model **Equipment** (com `usageStatus` p/ Estoque/Uso)
- [x] Model **User**, **Sector**, **EquipmentType**, **CalibrationRule**
- [x] Model **CalibrationRecord**, **AuditLog**
- [x] Enums: UserRole, UserStatus, EquipmentStatus, UsageStatus

---

## 3. Backend — APIs
- [x] CRUD completo para Equipamentos, Setores, Tipos, Regras
- [x] `GET /api/equipment` com filtros avançados
- [x] `POST /api/equipment/import` (Importação Excel)
- [x] `PATCH /api/equipment` (Mover Estoque <-> Uso)
- [x] Upload seguro via R2 Presigned URLs
- [x] Admin Users API

---

## 4. Auth / RBAC
- [x] Firebase Admin SDK
- [x] Helpers: `getCurrentUser`, `requireRole`
- [x] Middleware Next.js
- [x] RBAC no frontend (Sidebar, Botões)
- [x] Permissões granulares (CRIADOR, ADMIN, QUALIDADE, PRODUCAO)

---

## 5. Frontend — Funcionalidades Entregues

### 📊 Dashboard
- [x] KPIs, Gráficos (Barras, Donut, Área)
- [x] Widget Saúde do Setor
- [x] Tabela de Próximos Vencimentos

### 🛠️ Equipamentos (Em Uso)
- [x] Tabela com filtros e busca
- [x] **Importação via Excel**
- [x] **Exportação Avançada (PDF, Excel, Word)**
- [x] **Mover para Estoque**
- [x] Detalhes e Edição Inline

### 📦 Estoque (Novo)
- [x] Página dedicada `/estoque`
- [x] Gestão de localização física
- [x] **Mover para Uso** (com definição de setor/responsável)

### 📏 Calibrações
- [x] Histórico e Timeline
- [x] Upload/Download de certificados
- [x] Cálculo automático de vencimento (regras)

### ⚙️ Admin & Config
- [x] Gestão de Usuários (Aprovação/Bloqueio)
- [x] CRUD de Tipos e Regras
- [x] Configurações de Perfil e Tema

---

## 6. Próximos Passos (Backlog)

### 🗓️ Curto Prazo (Sprint Atual/Próxima)
- [x] **Calendário de Calibrações:** Visualização mensal/semanal de vencimentos (`/calendario`).
- [x] **Kanban de Serviços:** Gestão visual de ordens de serviço.
- [x] **Audit Logs Visual:** Interface para admins verem quem mudou o que.

### 🚀 Médio Prazo (Melhorias)
- [ ] **Notificações por Email:** Avisar vencimentos via SendGrid/Resend.
- [x] **QR Code:** Gerar etiquetas para colar nos equipamentos.
- [ ] **App Mobile:** PWA ou React Native para leitura de QR Code e consulta rápida.
- [ ] **Histórico de Movimentações:** Rastreabilidade completa de trocas de setor/estoque.

### 🔮 Longo Prazo (Visão)
- [ ] **Manutenção Preditiva:** IA analisando histórico para sugerir manutenções.
- [ ] **Integração IoT:** Sensores enviando dados de uso real.
- [ ] **Multi-tenant:** Suporte para múltiplas empresas/unidades independentes.

---

**Última atualização:** Fevereiro 2026
