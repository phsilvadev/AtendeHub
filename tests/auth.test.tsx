import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../app/login/page";
import Signup from "../app/cadastro/page";
import { AuthGuard } from "../components/auth-guard";
import { auth, storageKey, Identity } from "../lib/auth";
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const identity: Identity = {
  user: {
    id: "u1",
    company_id: "c1",
    name: "Pedro",
    email: "pedro@example.com",
    role: "admin",
    active: true,
  },
  company: {
    id: "c1",
    name: "Empresa Alfa",
    plan: "trial",
    trial_started_at: 1,
    trial_ends_at: 9999999999,
  },
  trial_expired: false,
};
function mockFetch(status: number, body: unknown) {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});
async function fillSignup(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome completo"), "Pedro Almeida");
  await user.type(screen.getByLabelText("Empresa"), "Empresa Alfa");
  await user.type(
    screen.getByLabelText("E-mail corporativo"),
    "pedro@example.com",
  );
  await user.type(
    screen.getByLabelText("Senha", { exact: true }),
    "Senha-teste-123",
  );
}
describe("formulários reais", () => {
  it("login envia credenciais, lembrar acesso e só navega após sucesso", async () => {
    const fetch = mockFetch(200, identity);
    const user = userEvent.setup();
    render(<Login />);
    await user.type(
      screen.getByLabelText("E-mail corporativo"),
      "pedro@example.com",
    );
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "Senha-teste-123",
    );
    await user.click(screen.getByLabelText("Lembrar meu acesso"));
    await user.click(screen.getByRole("button", { name: "Entrar no sistema" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("/api/v1/auth/login");
    expect(JSON.parse(options.body)).toEqual({
      email: "pedro@example.com",
      password: "Senha-teste-123",
      remember: true,
    });
    expect(options.credentials).toBe("same-origin");
    expect(localStorage.getItem("token")).toBeNull();
  });
  it("login inválido exibe erro e não entra no dashboard", async () => {
    mockFetch(401, { detail: "E-mail ou senha inválidos." });
    const user = userEvent.setup();
    render(<Login />);
    await user.type(
      screen.getByLabelText("E-mail corporativo"),
      "pedro@example.com",
    );
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "Senha-teste-123",
    );
    await user.click(screen.getByRole("button", { name: "Entrar no sistema" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("mostrar senha e recuperação não fingem envio", async () => {
    const fetch = mockFetch(200, {});
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    await user.click(screen.getByRole("button", { name: "Esqueceu a senha?" }));
    await user.type(
      screen.getByLabelText("E-mail corporativo"),
      "pedro@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Como recuperar o acesso" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "entre em contato com o administrador",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("cadastro bloqueia senhas diferentes antes de chamar API", async () => {
    const fetch = mockFetch(201, identity);
    const user = userEvent.setup();
    render(<Signup />);
    await fillSignup(user);
    await user.type(screen.getByLabelText("Confirme sua senha"), "Outra-senha");
    await user.click(
      screen.getByRole("button", { name: "Criar conta grátis" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "As senhas não coincidem",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("cadastro anuncia 7 dias e envia apenas os dados permitidos", async () => {
    const fetch = mockFetch(201, identity);
    const user = userEvent.setup();
    render(<Signup />);
    expect(screen.getByText(/7 dias grátis/)).toBeInTheDocument();
    await fillSignup(user);
    await user.type(
      screen.getByLabelText("Confirme sua senha"),
      "Senha-teste-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Criar conta grátis" }),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("/api/v1/auth/register");
    expect(JSON.parse(options.body)).toEqual({
      name: "Pedro Almeida",
      company: "Empresa Alfa",
      email: "pedro@example.com",
      password: "Senha-teste-123",
    });
  });
  it("cadastro duplicado exibe erro sem navegar", async () => {
    mockFetch(409, { detail: "E-mail indisponível." });
    const user = userEvent.setup();
    render(<Signup />);
    await fillSignup(user);
    await user.type(
      screen.getByLabelText("Confirme sua senha"),
      "Senha-teste-123",
    );
    await user.click(
      screen.getByRole("button", { name: "Criar conta grátis" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail indisponível",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("impede submissão duplicada enquanto aguarda resposta", async () => {
    let resolve!: (r: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    render(<Login />);
    await user.type(
      screen.getByLabelText("E-mail corporativo"),
      "pedro@example.com",
    );
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "Senha-teste-123",
    );
    await user.click(screen.getByRole("button", { name: "Entrar no sistema" }));
    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    expect(router.replace).not.toHaveBeenCalled();
    resolve(new Response(JSON.stringify(identity), { status: 200 }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
describe("proteção de sessão", () => {
  it("não renderiza conteúdo privado antes da validação", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(
      <AuthGuard>
        <div>Dados privados</div>
      </AuthGuard>,
    );
    expect(screen.queryByText("Dados privados")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Verificando");
  });
  it("sessão inválida redireciona para login", async () => {
    mockFetch(401, { detail: "Expirada" });
    render(
      <AuthGuard>
        <div>Dados privados</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Dados privados")).not.toBeInTheDocument();
  });
  it("API indisponível falha fechada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <AuthGuard>
        <div>Dados privados</div>
      </AuthGuard>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível verificar",
    );
    expect(screen.queryByText("Dados privados")).not.toBeInTheDocument();
  });
  it("trial vencido bloqueia dashboard e permite logout", async () => {
    const fetch = mockFetch(200, { ...identity, trial_expired: true });
    const user = userEvent.setup();
    render(
      <AuthGuard>
        <div>Dados privados</div>
      </AuthGuard>,
    );
    expect(
      await screen.findByText("Seu período de teste terminou"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Dados privados")).not.toBeInTheDocument();
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  });
  it("mostra conteúdo apenas com sessão válida e retira após expiração", async () => {
    const fetch = mockFetch(200, identity);
    render(
      <AuthGuard>
        <div>Dados privados</div>
      </AuthGuard>,
    );
    expect(await screen.findByText("Dados privados")).toBeInTheDocument();
    fetch.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    fireEvent.focus(window);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Dados privados")).not.toBeInTheDocument();
  });
  it("isola chaves locais por empresa e usuário", () => {
    expect(storageKey(identity)).not.toBe(
      storageKey({ ...identity, company: { ...identity.company, id: "c2" } }),
    );
    expect(storageKey(identity)).not.toBe(
      storageKey({ ...identity, user: { ...identity.user, id: "u2" } }),
    );
  });
  it("erro de infraestrutura na API não é interpretado como sucesso", async () => {
    mockFetch(502, {});
    await expect(auth.login("a@example.com", "senha", false)).rejects.toThrow(
      "Não foi possível concluir",
    );
  });
});
