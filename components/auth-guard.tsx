"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError, Identity } from "../lib/auth";
const IdentityContext = createContext<Identity | null>(null);
export function useIdentity() {
  const value = useContext(IdentityContext);
  if (!value) throw new Error("Identity is required");
  return value;
}
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const result = await auth.me();
        if (alive) {
          setIdentity(result);
          setError("");
        }
      } catch (e) {
        if (!alive) return;
        setIdentity(null);
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login");
        } else {
          setError(
            "Não foi possível verificar sua sessão. Recarregue a página para tentar novamente.",
          );
        }
      }
    }
    void check();
    const onFocus = () => {
      void check();
    };
    window.addEventListener("focus", onFocus);
    const timer = setInterval(onFocus, 60000);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [router]);
  async function logout() {
    try {
      await auth.logout();
      router.replace("/login");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) router.replace("/login");
      else setError("Não foi possível sair. Tente novamente.");
    }
  }
  if (error)
    return (
      <div className="auth-status" role="alert">
        <p>{error}</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!identity)
    return (
      <div className="auth-status" role="status">
        Verificando seu acesso…
      </div>
    );
  if (identity.trial_expired)
    return (
      <div className="auth-status">
        <h1>Seu período de teste terminou</h1>
        <p>
          {identity.company.name}: os 7 dias gratuitos terminaram. Entre em
          contato com a equipe para continuar.
        </p>
        <button className="primary" onClick={logout}>
          Sair da conta
        </button>
      </div>
    );
  return (
    <IdentityContext.Provider
      key={`${identity.company.id}:${identity.user.id}`}
      value={identity}
    >
      {children}
    </IdentityContext.Provider>
  );
}
