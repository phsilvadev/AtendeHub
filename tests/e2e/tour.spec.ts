import { test, expect } from "@playwright/test";
async function register(page) {
  const response = await page.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: {
      name: "Pedro Almeida",
      company: "Aço Moreira",
      email: `tour-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
test("tour destaca elementos, mantém foco, conclui e reabre sem repetir automaticamente", async ({
  page,
}) => {
  const account = await register(page);
  await page.goto("/");
  const tour = page.getByRole("dialog");
  await expect(tour).toHaveAccessibleName("Tudo começa pelo menu");
  await expect(tour).toBeFocused();
  const nav = await page.locator('[data-tour="navigation"]').boundingBox();
  const spot = await page.getByTestId("tour-spotlight").boundingBox();
  expect(Math.abs(spot!.x - (nav!.x - 7))).toBeLessThan(2);
  expect(spot!.width).toBeGreaterThan(nav!.width);
  await expect(page.locator("[data-tour-background]")).toHaveAttribute(
    "inert",
    "",
  );
  await tour.getByRole("button", { name: "Próximo" }).click();
  await expect(tour).toHaveAccessibleName("Seu resumo comercial");
  await page.screenshot({ path: test.info().outputPath("tour-desktop.png") });
  await tour.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(tour).toHaveAccessibleName("Tudo começa pelo menu");
  for (let i = 0; i < 6; i++)
    await tour.getByRole("button", { name: "Próximo" }).click();
  await expect(tour).toHaveAccessibleName("Sua conta, sempre à mão");
  await tour.getByRole("button", { name: "Concluir" }).focus();
  await page.keyboard.press("Tab");
  await expect(tour.getByRole("button", { name: "Fechar tour" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(tour.getByRole("button", { name: "Concluir" })).toBeFocused();
  await tour.getByRole("button", { name: "Concluir" }).click();
  await expect(tour).toHaveCount(0);
  await expect(page.locator("[data-tour-background]")).not.toHaveAttribute(
    "inert",
    "",
  );
  const key = `atendehub:${account.company.id}:${account.user.id}:dashboard-tour:v1`;
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "completed",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Olá, Pedro!" }),
  ).toBeVisible();
  await expect(tour).toHaveCount(0);
  await page.getByRole("button", { name: "Tour guiado" }).click();
  await expect(tour).toHaveAccessibleName("Tudo começa pelo menu");
  await page.keyboard.press("Escape");
  await expect(tour).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tour guiado" })).toBeFocused();
  await page.getByRole("button", { name: "Tour guiado" }).click();
  await tour.getByRole("button", { name: "Pular tour" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Olá, Pedro!" }),
  ).toBeVisible();
  await expect(tour).toHaveCount(0);
});
test("tour mobile mantém modal na tela em todas as etapas e isola o primeiro acesso por conta", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  await page.goto("/");
  const tour = page.getByRole("dialog");
  await expect(tour).toHaveAccessibleName("Tudo começa pelo menu");
  for (let i = 0; i < 7; i++) {
    const rect = await tour.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(391);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(845);
    if (i === 1) {
      const spotlight = await page.getByTestId("tour-spotlight").boundingBox();
      expect(rect!.y).toBeGreaterThanOrEqual(spotlight!.y + spotlight!.height);
      await page.screenshot({
        path: test.info().outputPath("tour-mobile.png"),
      });
    }
    if (i < 6) await tour.getByRole("button", { name: "Próximo" }).click();
  }
  await tour.getByRole("button", { name: "Concluir" }).click();
  await expect(tour).toHaveCount(0);
  await register(page);
  await page.reload();
  await expect(tour).toHaveAccessibleName("Tudo começa pelo menu");
});
