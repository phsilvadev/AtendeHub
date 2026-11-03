# AtendeHub — IA Atendimento

Plataforma de atendimento comercial para distribuidoras, inicialmente Aço Moreira. O visual existente foi preservado. Esta entrega implementa **somente a Fase 01 essencial**: cadastro multiempresa com teste gratuito de 7 dias, autenticação, sessão, permissões e proteção do frontend.

## Tecnologias

- Frontend na raiz: Next.js 15, React 19, TypeScript, CSS e lucide-react.
- Backend em `backend/`: Python 3.12+, FastAPI, SQLAlchemy 2, Pydantic, Alembic, Argon2.
- SQLite em desenvolvimento e testes. Nenhum Docker é necessário ou utilizado.
- Pytest, Vitest/Testing Library e Playwright.

## Executar em desenvolvimento

Requisitos: Python 3.12+, Node.js 20+ e npm. Os comandos abaixo usam shell Linux/macOS.

Terminal 1, a partir da raiz:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2, na raiz:

```bash
npm ci
cp .env.example .env
npm run dev
```

Abra **http://localhost:3000/cadastro**. Não há usuários ou empresas pré-cadastrados. O cadastro cria a empresa, seu administrador e a sessão. O período gratuito dura exatamente 7 dias a partir do relógio do servidor, sem cartão e sem renovar a cada login.

SQLite é criado em `backend/data/atendehub.db`, ignorado pelo Git. Sempre execute Alembic e FastAPI dentro de `backend/`. Não use `create_all` para substituir migrations. Para criar banco em outro caminho, altere `DATABASE_URL` antes de executar os comandos.

## Configuração e segurança

Frontend (`.env` da raiz):

- `BACKEND_URL`: endereço privado da API (padrão `http://127.0.0.1:8000`). Lido no servidor em runtime.
- `APP_ORIGIN`: origem pública do frontend (padrão de desenvolvimento: `http://localhost:3000`), usada no redirecionamento seguro ao login. Configure também ao iniciar o servidor de produção.

Backend (`backend/.env`):

- `DATABASE_URL`: SQLite de desenvolvimento.
- `ALLOWED_ORIGINS`: array JSON de origens permitidas para mutações; inclua a origem real do frontend, sem `/` final. A API rejeita POST sem Origin/Referer válido.
- `COOKIE_SECURE=false` somente em HTTP local; produção exige `true` e HTTPS.
- `SESSION_HOURS=12`: validade no servidor para sessão normal (cookie de navegador).
- `REMEMBER_DAYS=7`: cookie persistente ao selecionar “Lembrar meu acesso”. Isso não estende o trial.
- `APP_ENV=development`. Produção recusa SQLite e configuração insegura de cookies/origens.

Cookie opaco HttpOnly/SameSite=Lax; apenas o hash do token é armazenado. Não há JWT/token em localStorage. Logout revoga a sessão no banco. O middleware verifica a sessão na API antes de liberar o dashboard; o guard do cliente revalida a cada minuto e ao focar a janela. A API valida sessão, ativação, empresa e permissões em cada acesso protegido.

A empresa sempre vem da sessão, não de IDs enviados pelo formulário. Administradores acessam apenas usuários de sua empresa; vendedor/supervisor/operador não administram usuários. Um e-mail pertence a uma identidade/empresa nesta fase. Não há endpoint público para elevar privilégios, alterar plano ou renovar trial. Superadmin da plataforma e gestão completa de usuários ficam para outra etapa.

## Testes

Backend (bancos SQLite temporários, criados por migrations):

```bash
cd backend
source .venv/bin/activate
pytest -q
alembic check
```

Frontend, na raiz:

```bash
npm test
npm run typecheck
npm run build
```

Fluxo completo com API real + Next em modo de produção e SQLite temporário:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

O Playwright inicia e encerra Next na porta 3100 e FastAPI na 8100. As portas precisam estar livres. A configuração usa banco temporário, sem alterar o banco de desenvolvimento. Se Chromium já estiver instalado no sistema:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

## Produção e limites desta entrega

**O frontend deixou de ser uma exportação estática:** execute `npm run build` e `npm start`, com a API FastAPI acessível pelo `BACKEND_URL`. O proxy `/api/v1/*` mantém as chamadas no mesmo domínio do navegador. A configuração `.openai/hosting.json` é a identidade histórica do Site anterior; não é um plano de implantação deste backend. O endereço estático anterior não recebe esta autenticação automaticamente.

Produção requer provisionar API Python e banco persistente, validar PostgreSQL, configurar TLS, origem pública, limites no proxy, backups, monitoramento e política de retenção. Nada disso é simulado como implantado. Não execute a aplicação em produção com SQLite.

Dashboard, atendimentos, relatórios e catálogo ainda possuem dados demonstrativos identificados no visual. O estado local legado de atendimentos é separado por empresa e usuário e não substitui persistência comercial. Dados antigos sem identificação de empresa não são importados. Não há WhatsApp, ERP, IA, cobrança ou plano pago conectado. Integrações e dados comerciais reais serão implementados em fases futuras.

Recuperação de senha por e-mail está pendente: a interface orienta contato com administrador e não alega enviar um link. Não há credenciais de teste fixas nem sementes de produção.

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md): decisões, camadas, isolamento e fluxos.
- [CHECKLIST.md](CHECKLIST.md): escopo, tarefas validadas, bloqueios e próximos passos.
- [API.md](API.md): contratos, exemplos e permissões.
- [ATTRIBUTIONS.md](ATTRIBUTIONS.md): créditos Galaxy/Uiverse. Ilustração fornecida pelo responsável pelo projeto.

## Tour guiado do Dashboard

No primeiro acesso ao dashboard, o tour destaca um elemento por vez e escurece o restante da página. Possui sete etapas, Voltar, Próximo, Pular e Concluir. Escape fecha o tour; o foco fica no modal enquanto o restante da interface permanece bloqueado.

O botão **Tour guiado** reabre o guia, a partir das seções onde está disponível, retornando ao Dashboard. Configurações não exibe botões de tour nem de novo atendimento. Conclusão e dispensa são lembradas neste navegador por empresa, usuário e versão do tour (`dashboard-tour:v1`), sem armazenar credenciais. Ao limpar os dados do navegador ou usar outro navegador, ele pode aparecer novamente. O tour só é montado após autenticação e validação do trial.

Os testes Playwright verificam destaque, foco, navegação, persistência, reabertura, separação entre contas e posicionamento mobile. As capturas ficam na pasta ignorada `test-results/`.

## Configurações conectadas à API

A seção Configurações possui abas **Geral**, **Equipe** e **Segurança**. A aba Geral usa a identidade autenticada para exibir empresa, conta e datas reais do trial. Os dados cadastrais são somente leitura: o backend atual não oferece edição da empresa/perfil. O antigo formulário que alegava salvar preferências localmente foi substituído por informações reais.

Administradores consultam e cadastram usuários em `/api/v1/users`, escolhendo entre os perfis já suportados pela API. O novo usuário pode fazer login imediatamente. Não há envio automático de convite por e-mail. Vendedores, supervisores e operadores recebem uma mensagem de acesso restrito na aba Equipe; a API mantém a autorização no servidor.

Segurança permite encerrar a sessão atual. Alteração de senha, 2FA e gerenciamento de outras sessões ainda não estão disponíveis. WhatsApp, GestãoClick e IA aparecem somente como integrações em preparação, sem controles que simulem conexão.

Validação: 5 testes E2E aprovados, incluindo cadastro real de usuário na empresa correta, login como vendedor, restrição da equipe, logout e visualização mobile sem overflow. Nenhuma alteração no backend foi necessária.
