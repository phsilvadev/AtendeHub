// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("middleware de acesso", () => {
  it("permite login e cadastro sem consultar a API", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const path of ["/login", "/cadastro"]) {
      const response = await middleware(
        new NextRequest("http://localhost:3000" + path),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("bloqueia dashboard sem cookie", async () => {
    const response = await middleware(
      new NextRequest("http://localhost:3000/"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });
  it("cookie sozinho não autoriza acesso", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    const response = await middleware(
      new NextRequest("http://localhost:3000/", {
        headers: { cookie: "atendehub_session=forged" },
      }),
    );
    expect(response.status).toBe(307);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("consulta API antes de liberar e impede cache da página protegida", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const response = await middleware(
      new NextRequest("http://localhost:3000/", {
        headers: { cookie: "atendehub_session=opaque" },
      }),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetch.mock.calls[0][1].cache).toBe("no-store");
  });
  it("falha fechada e redireciona apenas para origem configurada", async () => {
    vi.stubEnv("APP_ORIGIN", "https://app.example.com");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const response = await middleware(
      new NextRequest("http://localhost:3000/?next=https://evil.example", {
        headers: { cookie: "atendehub_session=opaque" },
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example.com/login",
    );
  });
});
