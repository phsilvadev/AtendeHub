import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!["auth", "users"].includes(path[0]))
    return NextResponse.json(
      { detail: "Recurso não encontrado." },
      { status: 404 },
    );
  const url = new URL(
    "/api/v1/" + path.map(encodeURIComponent).join("/"),
    process.env.BACKEND_URL || "http://127.0.0.1:8000",
  );
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "origin", "referer"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      ...(request.method === "GET" ? {} : { body: await request.text() }),
    });
    const response = new NextResponse(
      upstream.status === 204 ? null : await upstream.text(),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") || "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    const retry = upstream.headers.get("retry-after");
    if (retry) response.headers.set("Retry-After", retry);
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Serviço de autenticação indisponível. Tente novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { proxy as GET, proxy as POST };
