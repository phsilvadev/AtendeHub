# Arquitetura — AtendeHub / Aço Moreira IA Atendimento

## Inventário e decisões
Frontend existente: Next.js 15 App Router, React 19, TypeScript, CSS, lucide. Preservado na raiz (não mover para frontend/). Há dashboard e formulários visuais, dados demonstrativos e estado local; não há backend anterior a reutilizar. Fontes, créditos Galaxy e ilustração preservados.

Fase 01: backend Python 3.12+, FastAPI, SQLAlchemy 2, Pydantic, Alembic, SQLite em desenvolvimento e testes. Não utilizar Docker. PostgreSQL será configurado e testado antes da produção. Redis/filas, IA e ERPs aguardam fases próprias.

## Fluxo HTTP
Navegador → Next.js /api/v1/* (proxy de mesma origem em Route Handler) → FastAPI → banco.
Next.js passa a executar em servidor, pois exportação estática não protege rotas nem faz proxy de autenticação. BACKEND_URL é configuração privada do servidor, nunca NEXT_PUBLIC. APP_ORIGIN define o destino público dos redirecionamentos. A normalização de URL do middleware foi desativada para preservar a origem em ambientes que usam 127.0.0.1; sem isso o Next converte o hostname em localhost e interfere no Origin/CSRF. Cookie opaco HttpOnly/SameSite=Lax, Secure em produção; tokens aleatórios de 256 bits, apenas hashes no banco, sem localStorage. Login/cadastro não retornam tokens em JSON.

O middleware consulta /auth/me antes de servir o dashboard; o componente de proteção revalida no navegador, inclusive ao focar a janela. API é a autoridade final: todos os endpoints protegidos validam usuário, sessão, empresa e trial. Middleware não substitui autorização da API. API inacessível resulta em falha fechada.

## Persistência e isolamento
Company possui trial_started_at/trial_ends_at UTC (epoch), status trial e ativação. Registro cria company, usuário admin e sessão atomicamente. Trial = exatamente 7×24h a partir do relógio do servidor, não renovado por login. Não existe endpoint público para alterar plano/datas.
User pertence a uma empresa, e-mail normalizado único globalmente (uma identidade por e-mail nesta fase), papel admin/supervisor/seller/operator, hash Argon2 e ativação. Session vincula user e company, expira, é revogada no logout e só armazena hash. Todas as consultas de usuário operacional filtram a empresa obtida da sessão. IDs UUID não substituem esse filtro. Alteração de empresa/papel no corpo é rejeitada. AuditEvent tem company_id, actor_id e ação; nunca senha/token. AuthAttempt persiste limite por identificador hash, sem depender de um único processo.

Estado local legado do dashboard é somente demonstrativo; segregado por company_id + user_id. Não é autorização nem banco comercial. Não carregamos dados estáticos antes de validar a sessão. Dados comerciais reais só na fase correspondente.

## Segurança
Argon2, respostas de login genéricas, limite persistente para login/cadastro por IP e e-mail, validação Origin/Referer em mutações, sem CORS amplo. Cookies não são acessíveis ao JS. Origin obrigatório inclusive em login/cadastro impede login CSRF. Respostas auth sem cache; senhas/tokens não entram em logs/auditoria. HTTPS e proxy confiável obrigatórios em produção; não confiar arbitrariamente em X-Forwarded-For. Configure a borda para limite adicional por IP. Sem credenciais de terceiros nesta fase.

Trial vencido permite /auth/me e logout, mas bloqueia operações do tenant (403 trial_expired). Front exibe estado específico e permite sair. Usuário/empresa inativos ou sessão revogada perdem acesso imediatamente na API.

## Camadas
backend/app/api: rotas/dependências; schemas: contratos; services: transações de auth; repositories: consultas tenant-scoped; models: ORM; core: configuração, banco, hashes e erros. Alembic é o responsável por criar/alterar tabelas (sem create_all no startup).

## Fases seguintes e bloqueios
CHECKLIST.md controla o escopo. Recuperação de senha depende de serviço de e-mail e não é fingida. Integrações requerem documentação oficial e credenciais; nenhuma chamada externa inventada. Produção exige API com disco/banco durável, PostgreSQL validado, TLS, monitoramento e backups. O endereço Sites anterior continua sendo a versão estática anterior até existir infraestrutura compatível.
