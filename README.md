# Agenda IECLB Santa Rosa

Aplicativo web da Comunidade Evangélica da Paz - IECLB Santa Rosa para agenda de eventos, avisos, pedidos de oração, confirmações de presença e painel da Secretaria.

## Tecnologias

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: SQLite
- Autenticação: JWT
- Senhas: bcrypt
- Importação de planilha: xlsx
- PWA: manifest, service worker e ícones instaláveis

## Estrutura

```text
backend/
  data/
  scripts/
  src/
frontend/
  public/
  src/
bd.xlsx
package.json
render.yaml
README.md
```

## Executar Localmente

Instale as dependências:

```bash
npm run install:all
```

Copie o arquivo de ambiente do backend:

```bash
copy backend\.env.example backend\.env
```

No macOS/Linux, use:

```bash
cp backend/.env.example backend/.env
```

Crie o usuário inicial da Secretaria:

```bash
npm run seed-admin
```

Importe a planilha `bd.xlsx`:

```bash
npm run import
```

Inicie o backend:

```bash
npm run backend
```

Em outro terminal, inicie o frontend:

```bash
npm run frontend
```

Acesse:

```text
http://localhost:5173
```

Backend local:

```text
http://localhost:3333/api/events
```

## Login Inicial

O sistema cria dois usuários iniciais:

```text
Usuário: secretaria
Senha: trocar123

Usuário: admin
Senha: trocar123
```

Depois do primeiro acesso, altere as senhas em **Secretaria > Configurações**. O usuário **admin** serve como acesso de segurança caso a senha da Secretaria seja esquecida.

## Variáveis de Ambiente

O backend usa as seguintes variáveis:

```text
PORT=3333
JWT_SECRET=troque-esta-chave-por-uma-chave-grande-e-segura
DATABASE_FILE=./data/database.sqlite
FRONTEND_URL=http://localhost:5173
```

No Render:

- `PORT`: o Render define automaticamente;
- `JWT_SECRET`: crie um valor longo e secreto;
- `DATABASE_FILE`: pode usar `./data/database.sqlite`;
- `FRONTEND_URL`: use a URL pública do Render, por exemplo `https://seu-app.onrender.com`.

## Build e Produção

Gerar build do frontend:

```bash
npm run build
```

Iniciar backend em modo produção local:

```bash
npm start
```

Para o Render, foram criados scripts próprios:

```bash
npm run render:build
npm run render:start
```

O script `render:start` cria o usuário inicial e importa a planilha antes de iniciar o backend. A importação é idempotente: eventos iguais não são duplicados.

## SQLite no Render

Para demonstração, o SQLite funciona com o arquivo definido em `DATABASE_FILE`.

Importante:

- o arquivo local `backend/data/database.sqlite` não deve ser enviado ao GitHub;
- no Render gratuito, o disco pode ser reiniciado em novos deploys ou reinicializações;
- como `bd.xlsx` está no projeto, o app recria/importa os eventos no start;
- para uso real em produção, o ideal é migrar para PostgreSQL ou contratar disco persistente no Render.

## PWA

O frontend está configurado como PWA com:

- `frontend/public/manifest.webmanifest`;
- `frontend/public/sw.js`;
- ícones em `frontend/public/icons/`;
- registro do service worker no frontend.

Para testar PWA localmente:

```bash
npm run build --prefix frontend
npm run preview --prefix frontend
```

No celular:

- Android: abrir no Chrome e tocar em **Adicionar à tela inicial** ou **Instalar aplicativo**;
- iPhone: abrir no Safari, compartilhar e escolher **Adicionar à Tela de Início**.

## Publicar no GitHub

1. Crie um repositório vazio no GitHub.
2. No terminal, dentro da pasta do projeto, execute:

```bash
git init
git add .
git commit -m "Preparar Agenda IECLB para publicação"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

Arquivos que devem ir ao GitHub:

- `backend/`, exceto `backend/node_modules`, `backend/.env` e banco SQLite local;
- `frontend/`, exceto `frontend/node_modules` e `frontend/dist`;
- `bd.xlsx`, se quiser que o Render importe os eventos da demonstração;
- `logo.jpg`, se existir na raiz do projeto;
- `package.json`;
- `render.yaml`;
- `.gitignore`;
- `README.md`.

Não enviar:

- `node_modules/`;
- `.env`;
- `backend/data/database.sqlite`;
- `frontend/dist/`;
- logs e arquivos temporários.

## Publicar no Render

### Opção recomendada: Web Service

1. Entre em https://render.com.
2. Clique em **New +**.
3. Escolha **Web Service**.
4. Conecte sua conta do GitHub.
5. Selecione o repositório da Agenda IECLB.
6. Configure:

```text
Environment: Node
Build Command: npm run render:build
Start Command: npm run render:start
```

7. Em **Environment Variables**, adicione:

```text
NODE_ENV=production
JWT_SECRET=coloque-uma-chave-grande-e-segura
DATABASE_FILE=./data/database.sqlite
FRONTEND_URL=https://SEU-APP.onrender.com
```

8. Clique em **Create Web Service**.
9. Aguarde o build terminar.
10. Abra a URL gerada pelo Render.

### Usando render.yaml

O arquivo `render.yaml` já foi criado. No Render, você também pode usar **Blueprint** e apontar para o repositório. Depois, ajuste a variável `FRONTEND_URL` para a URL real criada pelo Render.

## Observações Para Linux/Render

- Os caminhos do projeto usam `path` do Node.js e funcionam em Windows e Linux.
- A planilha `bd.xlsx` é lida por caminho relativo à raiz do projeto.
- O backend serve o build do frontend automaticamente quando `frontend/dist` existir.
- As rotas da API continuam em `/api`.
- O frontend em produção usa a mesma origem do site para chamar `/api`.


## Gestão de Usuários

Na área **Secretaria > Configurações**, um usuário autenticado pode:

- criar novos usuários administrativos;
- redefinir a senha de outro usuário;
- excluir usuários que não estejam em uso no momento.

Rotas administrativas:

```text
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id/password
DELETE /api/admin/users/:id
```
