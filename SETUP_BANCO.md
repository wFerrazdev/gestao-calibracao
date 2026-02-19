# 🔧 Guia Rápido: Configuração do Banco de Dados

## ⚠️ Problema Identificado

O arquivo `.env` está configurado para usar Prisma Postgres local, mas o servidor não está rodando.

```
DATABASE_URL="prisma+postgres://localhost:51213/..."
```

## ✅ Solução: Usar Neon (PostgreSQL Gratuito - Recomendado)

### Passo 1: Criar Conta no Neon

1. Acesse: https://neon.tech
2. Clique em "Sign Up" (pode usar conta Google/GitHub)
3. É **100% gratuito** para desenvolvimento

### Passo 2: Criar Projeto

1. Após login, clique em "Create Project"
2. Escolha um nome (ex: "gestao-calibracao")
3. Região: escolha a mais próxima (ex: "US East (Ohio)")
4. **NÃO FECHE A TELA** - você precisará da connection string

### Passo 3: Copiar Connection String

Na tela do projeto recém-criado, você verá:

```
Connection string:
postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require
```

**Copie essa string completa!**

### Passo 4: Atualizar .env

Abra o arquivo `c:\dev anti\gestao-calibracao\.env` e **substitua** a linha `DATABASE_URL` por:

```env
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require"
```

(Cole a string que você copiou do Neon)

### Passo 5: Rodar Migrations

Agora no terminal, execute (no diretório correto):

```bash
cd "c:\dev anti\gestao-calibracao"
npx prisma migrate dev --name init
```

Esse comando vai:
- ✅ Criar todas as tabelas no banco Neon
- ✅ Aplicar a migration "init"
- ✅ Gerar o Prisma Client

### Passo 6: Popular Dados Demo

```bash
npm run db:seed
```

Isso vai criar:
- 5 setores
- 8 tipos de equipamento
- 23 equipamentos com calibrações variadas

---

## 🚀 Alternativa: Prisma Postgres Local (Avançado)

Se preferir usar banco local (não recomendado para iniciantes):

```bash
# Instalar Prisma Postgres CLI globalmente
npm install -g @prisma/cli

# Iniciar servidor local
prisma dev
```

Mas **recomendo fortemente usar o Neon** - é muito mais simples e não precisa rodar nada localmente!

---

## ✅ Após Configurar

Quando o banco estiver conectado, você poderá:

1. **Ver os dados** com Prisma Studio:
   ```bash
   npx prisma studio
   ```
   Abre em http://localhost:5555

2. **Rodar a aplicação**:
   ```bash
   npm run dev
   ```
   Abre em http://localhost:3000

3. **Fazer login** e se tornar o CRIADOR (instruções no README.md)

---

## 🆘 Ainda com Problemas?

Erros comuns:

**"Can't reach database server"**
- Verifique se copiou a connection string correta do Neon
- Confirme que tem `?sslmode=require` no final da URL

**"Schema drift detected"**
```bash
npx prisma migrate reset
```
(⚠️ Isso apaga todos os dados - só use em desenvolvimento!)

**"Module not found"**
```bash
npx prisma generate
```

---

**Dica:** Salve a connection string do Neon em um lugar seguro. Você pode acessá-la a qualquer momento no dashboard do Neon.
