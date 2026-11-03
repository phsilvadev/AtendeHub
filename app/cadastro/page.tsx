"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/auth";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
export default function Signup() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <div className="login-page signup-page">
      <section className="login-story">
        <a href="/login" className="login-brand">
          <span>A</span>AtendeHub <small>IA Atendimento</small>
        </a>
        <div className="login-pitch">
          <span className="login-tag">SUA PRÓXIMA CONEXÃO COMEÇA AQUI</span>
          <h1>
            Mais organização.
            <br />
            Novas oportunidades.
          </h1>
          <img
            className="login-illustration"
            src="/atendehub-atendimento.jpg"
            width="1280"
            height="990"
            alt="Atendente AtendeHub com headset e notebook"
          />
        </div>
        <small className="login-copyright">
          © 2026 AtendeHub · Feito para construir relações.
        </small>
      </section>
      <section className="login-form-side">
        <a href="/login" className="login-back">
          <ArrowLeft size={15} /> Voltar ao login
        </a>
        <div className="login-form-wrap">
          <span className="login-mini">A</span>
          <h2>Crie sua conta</h2>
          <p>
            Comece com 7 dias grátis para sua empresa. Sem cartão de crédito.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setNotice("");
              const f = new FormData(e.currentTarget);
              if (f.get("password") !== f.get("confirmation")) {
                setNotice(
                  "As senhas não coincidem. Confira e tente novamente.",
                );
                return;
              }
              setBusy(true);
              try {
                await auth.register(
                  String(f.get("name")),
                  String(f.get("company")),
                  String(f.get("email")),
                  String(f.get("password")),
                );
                router.replace("/");
                router.refresh();
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível criar sua conta.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              name="name"
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Seu nome completo"
              required
            />
            <label htmlFor="company">Empresa</label>
            <input
              id="company"
              name="company"
              minLength={2}
              maxLength={160}
              autoComplete="organization"
              placeholder="Nome da sua empresa"
              required
            />
            <label htmlFor="email">E-mail corporativo</label>
            <input
              id="email"
              name="email"
              maxLength={254}
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              required
            />
            <label htmlFor="password">Senha</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="No mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <label htmlFor="confirmation">Confirme sua senha</label>
            <input
              id="confirmation"
              name="confirmation"
              type={show ? "text" : "password"}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              required
            />
            <button type="submit" className="login-submit" disabled={busy}>
              {busy ? "Criando conta…" : "Criar conta grátis"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          {notice && (
            <p role="alert" className="login-notice">
              {notice}
            </p>
          )}
          <p className="signup-link">
            Já tem uma conta? <a href="/login">Entrar</a>
          </p>
        </div>
        <div className="login-bottom">AtendeHub — IA Atendimento</div>
      </section>
    </div>
  );
}
