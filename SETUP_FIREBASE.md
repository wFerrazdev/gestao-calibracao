# 🔥 Configuração Firebase - PASSO A PASSO

## ❌ Problema Atual

Erro: `Firebase: Error (auth/invalid-api-key)`

**Causa:** As chaves do Firebase no `.env` são de exemplo e não funcionam.

---

## ✅ Solução: Criar Projeto Firebase Real

### Passo 1: Criar Projeto Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "**Adicionar projeto**"
3. Nome do projeto: `gestao-calibracao` (ou qualquer nome)
4. **Desabilite** Google Analytics (não é necessário)
5. Clique em "Criar projeto"
6. Aguarde ~30 segundos

### Passo 2: Habilitar Authentication

1. No menu lateral, clique em "**Authentication**"
2. Clique em "**Começar**"
3. Clique na aba "**Sign-in method**"
4. Clique em "**Email/Password**"
5. **Ative** a primeira opção (Email/Password)
6. Clique em "**Salvar**"

### Passo 3: Registrar Aplicação Web

1. Na página inicial do projeto, clique no ícone **`</>`** (Web)
2. Nome do app: `gestao-calibracao-web`
3. **NÃO** marque Firebase Hosting
4. Clique em "**Registrar app**"
5. Você verá um código JavaScript. **COPIE APENAS OS VALORES** do objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← COPIE ESTE
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."                    // ← ATÉ ESTE
};
```

6. Clique em "Continuar no console"

### Passo 4: Criar Service Account (Admin SDK)

1. Clique no ícone **⚙️** (configurações) ao lado de "Visão geral do projeto"
2. Clique em "**Configurações do projeto**"
3. Vá na aba "**Contas de serviço**"
4. Clique em "**Gerar nova chave privada**"
5. Clique em "**Gerar chave**"
6. Um arquivo `.json` será baixado. **NÃO PERCA ESTE ARQUIVO!**

### Passo 5: Preencher .env

Abra o arquivo `.env` em `c:\dev anti\gestao-calibracao\.env` e substitua:

```env
# =====================
# FIREBASE CLIENT (Frontend)
# =====================
# Cole os valores do firebaseConfig (Passo 3)
NEXT_PUBLIC_FIREBASE_API_KEY="Cole o apiKey aqui"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="Cole o authDomain aqui"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="Cole o projectId aqui"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="Cole o storageBucket aqui"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="Cole o messagingSenderId aqui"
NEXT_PUBLIC_FIREBASE_APP_ID="Cole o appId aqui"

# =====================
# FIREBASE ADMIN (Backend)
# =====================
# Abra o arquivo .json que você baixou no Passo 4
# Cole os valores deste arquivo:
FIREBASE_PROJECT_ID="valor de project_id no .json"
FIREBASE_CLIENT_EMAIL="valor de client_email no .json"
FIREBASE_PRIVATE_KEY="valor de private_key no .json"
# IMPORTANTE: A private_key tem quebras de linha (\n). Substitua TODAS por \\n
# Exemplo: "-----BEGIN PRIVATE KEY-----\nMIIE..." vira "-----BEGIN PRIVATE KEY-----\\nMIIE..."
```

### Passo 6: Reiniciar o Servidor

No terminal:

```bash
# Parar o servidor (Ctrl+C se estiver rodando)
# Limpar cache do Next.js
Remove-Item -Recurse -Force .next
# Rodar novamente
npm run dev
```

---

## 🎯 Exemplo Prático

**Arquivo .json baixado do Firebase:**
```json
{
  "project_id": "meu-projeto-123",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-abc@meu-projeto-123.iam.gserviceaccount.com"
}
```

**No .env deve ficar:**
```env
FIREBASE_PROJECT_ID="meu-projeto-123"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-abc@meu-projeto-123.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n"
```

**⚠️ ATENÇÃO:** Note que `\n` virou `\\n` na PRIVATE_KEY!

---

## ✅ Como Saber se Funcionou

Após preencher o `.env` e rodar `npm run dev`:

1. Abra http://localhost:3000
2. Você verá a página de login (sem erros!)
3. Conseguirá criar uma conta nova

---

## 🔐 Próximo Passo: Tornar-se CRIADOR

Após configurar o Firebase:

1. Crie sua conta na página de login
2. Copie seu Firebase UID (vou ensinar como depois)
3. Cole no `.env` em `AUTH_UID_CRIADOR`
4. Reinicie o servidor

Aí você terá permissões de administrador total!

---

## 🆘 Erros Comuns

**"auth/invalid-api-key"**
→ Você esqueceu de substituir as chaves do .env ou copiou errado

**"auth/project-not-found"**
→ O FIREBASE_PROJECT_ID está diferente do PROJECT_ID real

**"Failed to parse private key"**
→ Você não substituiu `\n` por `\\n` na PRIVATE_KEY

**"Quota exceeded"**
→ Firebase limitou sua região. Tente criar projeto em outra região (em Configurações)
