# CHECKLIST — AÇO MOREIRA IA / ATENDEHUB

Escopo aprovado: somente fundação/auth multiempresa, trial de 7 dias e proteção do frontend. SQLite em desenvolvimento. Sem Docker. Preservar o frontend na raiz.

## FASE 01 — FUNDAÇÃO / AUTENTICAÇÃO
- [x] Analisar repositório: Next 15, React 19, TypeScript, exportação estática; sem backend/auth/testes.
- [x] Definir arquitetura e plano incremental em ARCHITECTURE.md.
- [x] Configurar FastAPI, SQLAlchemy 2 e SQLite de desenvolvimento.
- [x] Criar migrations Alembic e validar upgrade de banco vazio.
- [x] Cadastro atômico de empresa + administrador + trial de 7 dias.
- [x] Hash Argon2 e sessões revogáveis em cookie HttpOnly.
- [x] Login, sessão atual e logout reais.
- [x] Isolamento multiempresa e permissões de administrador.
- [x] Expiração de trial e bloqueio de operações protegidas.
- [x] Proteção CSRF/origin, rate limiting e auditoria sem segredos.
- [x] Integrar cadastro/login/perfil/logout no Next.js.
- [x] Proteger acesso ao dashboard e separar estado local por empresa/usuário.
- [x] Testes automatizados do backend.
- [x] Testes automatizados do frontend.
- [x] Validar build, tipos e fluxos no navegador; gerar prints.
- [x] Atualizar README, ARCHITECTURE e API.
- [ ] PostgreSQL: planejado para produção; não executar nesta etapa.
- [ ] Recuperação de senha por e-mail: fora do escopo atual; depende de provedor de e-mail.
- [ ] Provisionamento/implantação de API Python + banco persistente: pendente.

## FASE 02 — ATENDIMENTOS (não iniciar nesta etapa)
- [ ] Entidades e endpoints de conversas/mensagens, status, atribuição, transferência e histórico.
## FASE 03 — WHATSAPP (não iniciar)
- [ ] API oficial, webhook autenticado, idempotência, filas, envio e retries.
## FASE 04 — INTELIGÊNCIA ARTIFICIAL (não iniciar)
- [ ] OpenAI, intenções, produtos, ferramentas controladas, segurança e testes.
## FASE 05 — GESTÃOCLICK (não iniciar)
- [ ] Validar documentação oficial, credenciais, adaptador, sincronizações e testes.
## FASE 06 — PRODUTOS E CLIENTES (não iniciar)
- [ ] Catálogo, pesquisa, sinônimos, clientes, histórico e deduplicação.
## FASE 07 — ORÇAMENTOS (não iniciar)
- [ ] Entidades, cálculos, preços do ERP, descontos, aprovação e status.
## FASE 08 — BASE DE CONHECIMENTO (não iniciar)
- [ ] Importação, revisão humana, versionamento e recuperação semântica.
## FASE 09 — DASHBOARD (não iniciar)
- [ ] Indicadores reais, séries, filtros e GET /api/v1/dashboard/overview.
## FASE 10 — RELATÓRIOS (não iniciar)
- [ ] Métricas por período, vendedor e empresa.
## FASE 11 — CONFIGURAÇÕES (não iniciar)
- [ ] Empresa, IA, regras comerciais, integrações e auditoria comercial.
## FASE 12 — VALIDAÇÃO E PRODUÇÃO (não iniciar)
- [ ] PostgreSQL, monitoramento, backups, retenção/LGPD e implantação.
- [ ] Testes dos fluxos WhatsApp → IA → ERP e aprovação humana.

## Bloqueios e limites
- Sem provedor SMTP: recuperação de senha não será simulada como envio real.
- O hosting atual é estático; autenticação real exige Next.js em servidor e a API Python. Não publicar um frontend que finja autenticação nesse hosting.
- WhatsApp, GestãoClick, OpenAI, cobrança e concessão de plano pago não fazem parte desta entrega.

## Validação desta entrega
- Pytest: 20 testes aprovados (cadastro atômico, Argon2, cookies, trial, permissões, multiempresa, sessões, CSRF, rate limiting, migrations).
- Vitest: 19 testes aprovados (formulários, erros, estado de carregamento, guard e middleware).
- Playwright: 2 fluxos aprovados com FastAPI real e SQLite temporário, Next em build de produção; desktop e mobile sem overflow.
- `npm run build`, `npm run typecheck` e `git diff --check`: aprovados.
- Nenhum Docker executado. Nenhuma integração externa simulada como real.

## Próxima atividade
Provisionar API e banco para publicação compatível, ou implementar recuperação segura de senha após definir o serviço de e-mail. Não iniciar módulos comerciais sem nova definição de escopo.
