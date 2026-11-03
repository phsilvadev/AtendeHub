import { test, expect } from "@playwright/test";
async function createCompany(page) {
  const response = await page.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: {
      name: "Pedro Almeida",
      company: "AtendeHub",
      email: `settings-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
async function openSettings(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Pular tour" }).click();
  await page
    .getByRole("button", { name: "Expandir menu lateral", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dados da empresa" }),
  ).toBeVisible();
}
test("configurações usam dados reais e administrador cadastra membro da equipe", async ({
  page,
}) => {
  const account = await createCompany(page);
  await openSettings(page);
  await expect(
    page.getByRole("button", { name: "Tour guiado", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Novo atendimento", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Rever tour do Dashboard" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Nome da empresa", { exact: true })).toHaveValue(
    account.company.name,
  );
  await expect(page.getByLabel("E-mail de acesso")).toHaveValue(
    account.user.email,
  );
  await expect(
    page.getByRole("heading", { name: "Teste gratuito", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Configurações", exact: true }),
  ).toHaveCSS("background-color", "rgb(94, 89, 243)");
  await page.screenshot({
    path: test.info().outputPath("settings-desktop.png"),
    fullPage: true,
  });
  await page
    .getByRole("article", { name: "Teste gratuito" })
    .screenshot({ path: test.info().outputPath("trial-card-desktop.png") });
  await page.getByRole("tab", { name: /Equipe/ }).click();
  await expect(
    page.getByText(account.user.email, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Adicionar usuário" }).click();
  const modal = page.getByRole("dialog", { name: "Adicionar usuário" });
  await modal.getByLabel("Nome completo").fill("Mariana Souza");
  const sellerEmail = `mariana-${Date.now()}@example.com`;
  await modal.getByLabel("E-mail", { exact: true }).fill(sellerEmail);
  await modal
    .getByLabel("Senha inicial", { exact: true })
    .fill("Senha-segura-456");
  await modal.getByLabel("Perfil de acesso").selectOption("seller");
  await modal.getByRole("button", { name: "Cadastrar usuário" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText(sellerEmail, { exact: true })).toBeVisible();
  const response = await page.request.get("/api/v1/users");
  expect(response.status()).toBe(200);
  const member = (await response.json()).find((u) => u.email === sellerEmail);
  expect(member.company_id).toBe(account.company.id);
  expect(member.role).toBe("seller");
  await page.screenshot({
    path: test.info().outputPath("settings-team-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Segurança", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Segurança da sua conta" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-mail corporativo").fill(sellerEmail);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-456");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Mariana!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pular tour" }).click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByRole("tab", { name: "Equipe", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Acesso restrito ao administrador" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar usuário" }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Geral", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dados da empresa" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("settings-mobile.png"),
    fullPage: true,
  });
});
