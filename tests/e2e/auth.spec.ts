import { test, expect } from "@playwright/test";
test("cadastro → trial → logout → login com API e SQLite reais", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await page.getByLabel("Nome completo").fill("Ana Moreira");
  await page.getByLabel("Empresa", { exact: true }).fill("Distribuidora Alfa");
  const email = `ana-${Date.now()}@example.com`;
  await page.getByLabel("E-mail corporativo").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByLabel("Confirme sua senha").fill("Senha-segura-123");
  await page.screenshot({
    path: test.info().outputPath("cadastro-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  await expect(
    page.getByText("Teste gratuito · 7 dias restantes"),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "atendehub_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "atendehub_session",
  );
  await page.screenshot({
    path: test.info().outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Ana Moreira/ }).click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-mail corporativo").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-errada-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos" }),
  ).toContainText("E-mail ou senha inválidos");
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("cookie forjado não libera dashboard e cadastro é responsivo", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "atendehub_session",
      value: "forjado",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cadastro");
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("cadastro-mobile.png"),
    fullPage: true,
  });
});
