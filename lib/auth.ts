export type Identity = {
  user: {
    id: string;
    company_id: string;
    name: string;
    email: string;
    role: "admin" | "supervisor" | "seller" | "operator";
    active: boolean;
  };
  company: {
    id: string;
    name: string;
    plan: string;
    trial_started_at: number;
    trial_ends_at: number;
  };
  trial_expired: boolean;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Tente novamente.",
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      typeof payload.detail === "string"
        ? payload.detail
        : payload.detail?.message ||
            "Não foi possível concluir a operação. Tente novamente.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const auth = {
  me: () => api<Identity>("/auth/me"),
  login: (email: string, password: string, remember: boolean) =>
    api<Identity>("/auth/login", { email, password, remember }),
  register: (name: string, company: string, email: string, password: string) =>
    api<Identity>("/auth/register", { name, company, email, password }),
  logout: () => api<void>("/auth/logout", {}),
};
export const roleLabels: Record<Identity["user"]["role"], string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  seller: "Vendedor",
  operator: "Operador",
};
export function storageKey(identity: Identity) {
  return `atendehub:${identity.company.id}:${identity.user.id}:atendimentos`;
}
