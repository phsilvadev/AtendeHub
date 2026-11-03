# Relatório de desenvolvimento — Fase 01 essencial

## Fase atual
Fundação de autenticação multiempresa com trial; não foram iniciadas as fases comerciais do prompt mestre. Marca AtendeHub e frontend na raiz preservados.

## Tarefas concluídas
- FastAPI + SQLAlchemy + SQLite local, migrations Alembic reversíveis.
- Cadastro atômico de empresa e administrador com teste de 7 dias.
- Hash Argon2, cookie opaco HttpOnly, sessões com validade/revogação e logout.
- Origem validada em mutações, controle de tentativas persistido, auditoria sem segredos.
- Consulta/criação de usuários por admin da própria empresa. Isolamento por tenant na API.
- Cadastro/login integrados à API; perfil real, logout e indicador de trial no dashboard.
- Middleware e guard do cliente; bloqueio de trial vencido; nenhum fallback para login falso.
- Chaves de demonstração locais segregadas por empresa e usuário, sem importar dados legados sem tenant.

## Arquivos criados
- `backend/app/{api,core,models,schemas,services,repositories}/`: aplicação Python modular.
- `backend/migrations/`, `backend/alembic.ini`: migrations.
- `backend/requirements.txt`, `backend/.env.example`, `backend/pytest.ini`.
- `backend/tests/`: autenticação, permissões, isolamento e migrations.
- `lib/auth.ts`, `components/auth-guard.tsx`, `middleware.ts`, `app/api/v1/[...path]/route.ts`.
- `tests/`, `vitest.config.ts`, `playwright.config.ts`, `scripts/start-test-api.py`.
- `.env.example`, `ARCHITECTURE.md`, `CHECKLIST.md`, `API.md`, este relatório.

## Arquivos modificados
README, .gitignore, package.json/lock, next.config.ts, login, cadastro, dashboard e estilos auxiliares. A configuração passou de exportação estática a servidor Next com proxy privado. Formatação aplicada aos componentes editados para facilitar manutenção.

## Testes e resultados
- Backend: **20 testes Pytest aprovados** com SQLite temporário criado via migrations, incluindo downgrade/upgrade e ausência de drift ORM.
- Frontend: **19 testes Vitest aprovados** com Testing Library, incluindo erros de autenticação, submissão pendente, senhas diferentes, API indisponível, trial vencido e middleware.
- E2E: **2 testes Playwright aprovados** com API real, banco temporário e build de produção do Next: cadastro → dashboard → logout → login → reload; cookie forjado; layout mobile.
- Build de produção e checagem TypeScript aprovados.
- Não executamos Docker nem chamadas para WhatsApp/GestãoClick/OpenAI.

## Pendências e bloqueios
- SMTP/provedor não definido: recuperação por e-mail não implementada; interface comunica indisponibilidade sem simular envio.
- Infraestrutura persistente da API não provisionada; não publicamos a versão auth no hosting estático anterior.
- PostgreSQL e configuração de produção ainda precisam de validação. SQLite é usado apenas no desenvolvimento/testes.
- Fases seguintes pendentes: conversas reais, ERP, WhatsApp, OpenAI, dashboard/relatórios com dados reais, cobrança, gestão completa de usuários e superadmin.
- Backend limita tentativas por IP observado sem confiar em X-Forwarded-For; atrás do Next esse IP é agregado. Antes de produção, configurar limite na borda/proxy confiável.
- Um aviso de depreciação do transporte httpx do TestClient vem da versão atual do Starlette; não houve falha de teste.

## Próxima tarefa
Definir implantação compatível com Next + FastAPI e banco persistente, ou o serviço de e-mail para recuperação segura. Não extrapolar para outros módulos sem novo escopo.
