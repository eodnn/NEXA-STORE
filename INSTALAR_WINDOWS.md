# Instalação do NEXA STORE no Windows (sem Docker)

> Tempo dedicado à configuração: instale as ferramentas *antes* de apresentar. A apresentação funciona sem Internet depois que as dependências estiverem instaladas.

## Pré-requisitos

- **Node.js 20 ou superior (LTS)**: https://nodejs.org
- **MySQL Community Server 8**: https://dev.mysql.com/downloads/mysql/
- **MySQL Workbench**: https://dev.mysql.com/downloads/workbench/
- VS Code e Chrome/Edge (opcionais). Não exige conta em serviço externo.

## 1. Extraia o ZIP

Extraia `NEXA_STORE_COMPLETO.zip` para uma pasta, por exemplo `C:\Projetos\NEXA_STORE`. Abra essa pasta no VS Code e o Terminal (PowerShell).

## 2. Crie o banco

Abra MySQL Workbench, conecte à instância local com a senha configurada na instalação do MySQL. Abra `banco.sql` em **File > Open SQL Script** e clique no raio para executar. O script cria o banco `nexa_store` e nove tabelas.

Se aparecer erro de conexão, verifique se o serviço `MySQL80` está iniciado em `services.msc`. O banco não é substituído por arquivos locais.

## 3. Crie seu `.env`

Copie `.env.example` para `.env` na pasta principal (no PowerShell):

```powershell
Copy-Item .env.example .env
```

Edite usando o VS Code:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_LOCAL_MYSQL
DB_NAME=nexa_store
JWT_SECRET=MUDE_PARA_UMA_CHAVE_ALEATORIA_COM_MAIS_DE_32_CARACTERES
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@nexastore.com
SEED_ADMIN_PASSWORD=Nexa@2026!
```

**Atenção:** a senha acima é **somente um exemplo de demonstração**; troque-a se publicar o sistema. `.env` fica fora do GitHub. Gere uma JWT_SECRET única; não use a chave do exemplo literalmente. Senhas nunca são guardadas em texto puro no MySQL: o seed gera hashes bcrypt.

## 4. Instale e prepare

No terminal da pasta principal:

```powershell
npm install
npm --prefix frontend install
npm run setup
npm run build
npm start
```

Acesse **http://localhost:3000**. Para iniciar nas próximas vezes, basta abrir `INICIAR_NEXA_STORE.bat` ou executar `npm start`. No primeiro uso o `.bat` verifica o ambiente e prepara o frontend caso necessário, mas a importação do SQL e o preenchimento do `.env` devem ser feitos por você.

**Conta demo**: `admin@nexastore.com` / `Nexa@2026!` (caso use o `.env` de demonstração sem alterar a senha e o banco ainda não tenha este administrador). Se já havia um administrador, o script de seed não muda sua senha.

## 5. Desenvolvimento (se quiser editar a interface)

Em dois terminais:

```powershell
# Terminal 1 (backend, porta 3000)
npm run dev

# Terminal 2 (frontend Vite, porta 5173)
npm --prefix frontend run dev
```

Abra http://localhost:5173. O Vite redireciona `/api` para o Express. Para servir o frontend compilado pelo Express em produção local: `npm run build` e `npm start`, porta 3000.

## Soluções rápidas

| Problema | Solução |
|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | Inicie o serviço MySQL e revise DB_HOST e DB_PORT. |
| `Access denied for user root` | Confira DB_USER e DB_PASSWORD no `.env`. |
| `Unknown database 'nexa_store'` | Execute `banco.sql` no Workbench. |
| `JWT_SECRET... 32 caracteres` | Coloque chave maior e aleatória no `.env`. |
| Tela de login sem conseguir entrar | Rode `npm run setup` e confira a senha do seed. |
| `npm: comando não encontrado` | Reinstale Node.js e abra outro terminal. |
| `Frontend não compilado` | Execute `npm --prefix frontend install` e `npm run build`. |
| Porta 3000 ocupada | Altere `PORT=3001` no `.env` e acesse localhost:3001. |
| Gráficos vazios | Execute `npm run setup` (em base nova) e confirme se há vendas. |

### Segurança mínima

Execute localmente para demonstração. Evite expor a API diretamente na Internet sem HTTPS, política de CORS revisada, contas específicas e gestão de segredo. O projeto é um protótipo acadêmico com autenticação e transações, não um gateway de pagamento ou sistema fiscal homologado.

**Nota sobre lockfiles:** como o registro público de pacotes estava indisponível durante a montagem deste projeto, os `package-lock.json` incluídos são iniciais e serão atualizados por `npm install` na primeira instalação. Não comece com `npm ci`.
