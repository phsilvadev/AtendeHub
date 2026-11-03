# AtendeHub

Sistema de gestão de atendimento comercial em Next.js 15, React 19 e TypeScript.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Telas

- `/`: dashboard, indicadores comerciais, conversas e produtos.
- `/login`: formulário de acesso e recuperação de senha.
- `/cadastro`: formulário de cadastro com confirmação de senha.

## Validação e build

```bash
npm run typecheck
npm run build
```

A exportação estática é gerada em `out/`.

## Estado das integrações

A interface utiliza dados demonstrativos. Novos atendimentos são salvos no navegador via localStorage. Login, cadastro, recuperação de senha, WhatsApp e IA ainda precisam de serviços reais; o login atual redireciona ao dashboard sem autenticar. A exportação CSV está disponível em Atendimentos e Relatórios.

## Créditos

Componentes Galaxy/Uiverse adaptados: consulte [ATTRIBUTIONS.md](ATTRIBUTIONS.md). A ilustração foi fornecida pelo responsável pelo projeto.
