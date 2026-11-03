"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ShieldCheck,
  CalendarDays,
  ArrowUpRight,
  Check,
  Copy,
  LockKeyhole,
  Mail,
  Plus,
  RefreshCw,
  MessageSquare,
  Package,
  Zap,
  X,
  LogOut,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { useIdentity } from "./auth-guard";
import { auth, api, ApiError, Identity, roleLabels } from "../lib/auth";
type User = Identity["user"];
const roles = Object.entries(roleLabels) as [User["role"], string][];
function date(value: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value * 1000));
}
export function SettingsPage({ onTour }: { onTour: () => void }) {
  const initial = useIdentity();
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState("general");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const admin = data.user.role === "admin";
  const days = Math.max(
    0,
    Math.ceil((data.company.trial_ends_at * 1000 - Date.now()) / 86400000),
  );
  function fail(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      router.replace("/login");
      return;
    }
    setError(
      e instanceof Error ? e.message : "Não foi possível concluir a operação.",
    );
  }
  async function loadUsers() {
    if (!admin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setUsers(await api<User[]>("/users"));
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let alive = true;
    if (!admin) {
      setLoading(false);
      return;
    }
    api<User[]>("/users")
      .then((result) => {
        if (alive) setUsers(result);
      })
      .catch((e) => {
        if (alive) fail(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [data.company.id, admin]);
  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      setData(await auth.me());
      await loadUsers();
      setNotice("Informações atualizadas.");
    } catch (e) {
      fail(e);
    } finally {
      setRefreshing(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await auth.logout();
      router.replace("/login");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-page">
      <div className="settings-intro">
        <div>
          <span className="settings-eyebrow">SEU ESPAÇO DE TRABALHO</span>
          <p>
            Organize sua empresa, acompanhe seu plano e gerencie quem tem
            acesso.
          </p>
        </div>
        <button
          className="settings-secondary"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw size={15} />
          {refreshing ? "Atualizando…" : "Atualizar dados"}
        </button>
      </div>
      <div className="settings-tabs" role="tablist" aria-label="Configurações">
        {[
          ["general", "Geral", Building2],
          ["team", "Equipe", Users],
          ["security", "Segurança", ShieldCheck],
        ].map(([id, label, Icon]: any) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const ids = ["general", "team", "security"];
                const next =
                  ids[
                    (ids.indexOf(tab) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                  ];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            onClick={() => {
              setTab(id);
              setError("");
              setNotice("");
            }}
          >
            <Icon size={17} />
            {label}
            {id === "team" && admin && !loading && <span>{users.length}</span>}
          </button>
        ))}
      </div>
      {!modal && error && (
        <div role="alert" className="settings-feedback error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="settings-feedback">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}
      {tab === "general" && (
        <div
          role="tabpanel"
          id="panel-general"
          aria-labelledby="tab-general"
          className="settings-grid"
        >
          <div className="settings-main">
            <article className="card settings-card">
              <div className="settings-card-title">
                <span className="settings-symbol">
                  <Building2 size={21} />
                </span>
                <div>
                  <h2>Dados da empresa</h2>
                  <p>As informações que identificam seu espaço de trabalho.</p>
                </div>
                <span className="settings-status">
                  <i />
                  Ativa
                </span>
              </div>
              <div className="settings-company">
                <span>{data.company.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <h3>{data.company.name}</h3>
                  <p>Workspace comercial · AtendeHub</p>
                </div>
              </div>
              <div className="settings-fields">
                <label>
                  Nome da empresa
                  <input readOnly value={data.company.name} />
                </label>
                <label>
                  Seu perfil de acesso
                  <input readOnly value={roleLabels[data.user.role]} />
                </label>
              </div>
              <div className="settings-id">
                <span>
                  IDENTIFICADOR DA EMPRESA<code>{data.company.id}</code>
                </span>
                <button
                  title="Copiar identificador da empresa"
                  aria-label="Copiar identificador da empresa"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(data.company.id);
                      setNotice("Identificador copiado.");
                    } catch {
                      setError(
                        "Não foi possível copiar. Selecione o identificador e copie manualmente.",
                      );
                    }
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="settings-note">
                <Info size={15} />
                <span>
                  Dados do cadastro. A edição das informações da empresa ainda
                  não está disponível.
                </span>
              </div>
            </article>
            <article className="card settings-card">
              <div className="settings-card-title">
                <span className="settings-symbol blue">
                  <Mail size={20} />
                </span>
                <div>
                  <h2>Minha conta</h2>
                  <p>Seu acesso a este espaço de trabalho.</p>
                </div>
                <span className="settings-account-role">
                  {roleLabels[data.user.role]}
                </span>
              </div>
              <div className="settings-fields">
                <label>
                  Nome completo
                  <input value={data.user.name} readOnly />
                </label>
                <label>
                  E-mail de acesso
                  <input value={data.user.email} readOnly />
                </label>
              </div>
              <div className="settings-inline-bottom">
                <span>
                  <ShieldCheck size={15} />
                  Conta {data.user.active ? "ativa" : "inativa"} e sessão
                  autenticada
                </span>
                <button onClick={() => setTab("security")}>
                  Ver segurança <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
            <article className="card settings-card">
              <div className="settings-card-title">
                <div>
                  <h2>Conexões do seu comercial</h2>
                  <p>
                    O próximo passo para reunir sua operação em um só lugar.
                  </p>
                </div>
              </div>
              <div className="settings-integrations">
                {[
                  [
                    "WhatsApp Business",
                    "Canal de atendimento",
                    MessageSquare,
                    "green",
                  ],
                  ["GestãoClick ERP", "Catálogo e operação", Package, "blue"],
                  [
                    "Inteligência artificial",
                    "Assistente comercial",
                    Zap,
                    "purple",
                  ],
                ].map(([name, description, Icon, color]: any) => (
                  <div key={name}>
                    <span className={`settings-symbol ${color}`}>
                      <Icon size={19} />
                    </span>
                    <strong>{name}</strong>
                    <small>{description}</small>
                    <span className="settings-coming">
                      <LockKeyhole size={10} />
                      Em preparação
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
          <aside className="settings-aside">
            <article className="card settings-plan">
              <span className="settings-plan-label">
                <Zap size={14} />
                SEU PLANO ATUAL
              </span>
              <h2>Teste gratuito</h2>
              <p>Um novo começo para o seu atendimento.</p>
              <div className="settings-days">
                <strong>{days}</strong>
                <span>
                  dias restantes
                  <br />
                  de 7 dias gratuitos
                </span>
              </div>
              <div className="settings-plan-track">
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, (days / 7) * 100))}%`,
                  }}
                />
              </div>
              <div className="settings-plan-dates">
                <span>
                  <CalendarDays size={14} />
                  Início<strong>{date(data.company.trial_started_at)}</strong>
                </span>
                <span>
                  <CalendarDays size={14} />
                  Término<strong>{date(data.company.trial_ends_at)}</strong>
                </span>
              </div>
              <div className="settings-plan-note">
                <Check size={14} />
                Sem cobrança automática
              </div>
              <small>
                Ao encerrar o teste, entre em contato com a equipe para
                continuar. A contratação de planos ainda não está disponível.
              </small>
            </article>
            <article className="card settings-access">
              <span className="settings-symbol green">
                <ShieldCheck size={22} />
              </span>
              <h2>Acesso sob controle</h2>
              <p>
                Cada empresa possui seu próprio espaço. As permissões são
                verificadas em cada acesso.
              </p>
              <div>
                <CheckCircle2 size={14} />
                Sessão protegida
              </div>
              <div>
                <CheckCircle2 size={14} />
                Perfis por função
              </div>
              <button onClick={() => setTab(admin ? "team" : "security")}>
                {admin ? "Gerenciar equipe" : "Ver minha segurança"}
                <ArrowUpRight size={15} />
              </button>
            </article>
            <button className="settings-tour-help" onClick={onTour}>
              <span>
                Precisa de uma orientação?
                <strong>Rever tour do Dashboard</strong>
              </span>
              <ArrowUpRight size={17} />
            </button>
          </aside>
        </div>
      )}
      {tab === "team" && (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team">
          <article className="card settings-card">
            <div className="settings-card-title">
              <span className="settings-symbol">
                <Users size={21} />
              </span>
              <div>
                <h2>Equipe e permissões</h2>
                <p>Controle quem participa de {data.company.name}.</p>
              </div>
              {admin && (
                <button
                  className="primary"
                  onClick={() => {
                    setModal(true);
                    setShow(false);
                    setError("");
                    setNotice("");
                  }}
                >
                  <Plus size={15} />
                  Adicionar usuário
                </button>
              )}
            </div>
            {!admin ? (
              <div className="settings-empty">
                <LockKeyhole size={28} />
                <h3>Acesso restrito ao administrador</h3>
                <p>
                  Seu perfil é {roleLabels[data.user.role].toLowerCase()}. Fale
                  com o administrador da empresa para gerenciar a equipe.
                </p>
              </div>
            ) : loading ? (
              <div className="settings-empty" role="status">
                Carregando equipe…
              </div>
            ) : (
              <div className="settings-table">
                <table>
                  <thead>
                    <tr>
                      <th>USUÁRIO</th>
                      <th>PERFIL</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="settings-user">
                            <span>{user.name.slice(0, 1).toUpperCase()}</span>
                            <div>
                              <strong>
                                {user.name}
                                {user.id === data.user.id && (
                                  <small>Você</small>
                                )}
                              </strong>
                              <p>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="settings-role">
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td>
                          <span className="settings-status">
                            <i />
                            {user.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="settings-note">
              <ShieldCheck size={15} />
              <span>
                Somente administradores podem cadastrar usuários. Alteração de
                perfil, desativação e convites por e-mail ainda não estão
                disponíveis.
              </span>
            </div>
          </article>
          <div className="settings-role-grid">
            {roles.map(([key, label]) => (
              <article className="card" key={key}>
                <ShieldCheck size={19} />
                <h3>{label}</h3>
                <p>
                  {key === "admin"
                    ? "Consulta e cadastra usuários da empresa."
                    : "Acessa o espaço da empresa sem administrar usuários."}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
      {tab === "security" && (
        <div
          role="tabpanel"
          id="panel-security"
          aria-labelledby="tab-security"
          className="settings-grid"
        >
          <div className="settings-main">
            <article className="card settings-card">
              <div className="settings-card-title">
                <span className="settings-symbol green">
                  <ShieldCheck size={21} />
                </span>
                <div>
                  <h2>Segurança da sua conta</h2>
                  <p>Seu acesso e suas permissões neste espaço.</p>
                </div>
              </div>
              <div className="settings-security-row">
                <div>
                  <strong>Sessão atual</strong>
                  <p>Você está conectado como {data.user.email}.</p>
                </div>
                <span className="settings-status">
                  <i />
                  Autenticada
                </span>
              </div>
              <div className="settings-security-row">
                <div>
                  <strong>Perfil de acesso</strong>
                  <p>As ações disponíveis respeitam sua função na empresa.</p>
                </div>
                <span className="settings-role">
                  {roleLabels[data.user.role]}
                </span>
              </div>
              <div className="settings-security-row">
                <div>
                  <strong>Senha de acesso</strong>
                  <p>
                    A alteração e a recuperação de senha por e-mail ainda não
                    estão disponíveis. Em caso de dificuldade, contate o
                    administrador.
                  </p>
                </div>
                <LockKeyhole size={20} />
              </div>
              <div className="settings-security-row">
                <div>
                  <strong>Autenticação em duas etapas</strong>
                  <p>Este recurso ainda não está disponível.</p>
                </div>
                <span className="settings-coming">Em preparação</span>
              </div>
            </article>
            <article className="card settings-card">
              <div className="settings-card-title">
                <span className="settings-symbol orange">
                  <LogOut size={20} />
                </span>
                <div>
                  <h2>Encerrar sessão</h2>
                  <p>Desconecte sua conta deste navegador.</p>
                </div>
                <button
                  className="settings-signout"
                  disabled={busy}
                  onClick={logout}
                >
                  {busy ? "Saindo…" : "Sair da conta"}
                  <LogOut size={15} />
                </button>
              </div>
              <div className="settings-note">
                Ao sair, sua sessão atual é revogada no servidor. Você precisará
                entrar novamente para acessar o sistema.
              </div>
            </article>
          </div>
          <aside className="settings-aside">
            <article className="card settings-access">
              <ShieldCheck size={28} />
              <h2>Seu espaço é privado</h2>
              <p>
                Os dados da empresa são separados dos dados de outras empresas,
                e o acesso depende de uma sessão válida.
              </p>
            </article>
          </aside>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setModal(false)}
        >
          <section
            className="modal settings-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-btn"
              aria-label="Fechar cadastro de usuário"
              disabled={busy}
              onClick={() => setModal(false)}
            >
              <X size={20} />
            </button>
            <span className="modal-icon">
              <Users size={22} />
            </span>
            <h2 id="add-user-title">Adicionar usuário</h2>
            <p>Cadastre um novo acesso para {data.company.name}.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const f = new FormData(e.currentTarget);
                setBusy(true);
                setError("");
                try {
                  await api<User>("/users", {
                    name: String(f.get("name")),
                    email: String(f.get("email")),
                    password: String(f.get("password")),
                    role: String(f.get("role")),
                  });
                  setModal(false);
                  await loadUsers();
                  setNotice(
                    "Usuário cadastrado com sucesso. Compartilhe o acesso de forma segura; nenhum e-mail foi enviado.",
                  );
                } catch (e) {
                  fail(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Nome completo
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoFocus
                  autoComplete="off"
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="off"
                />
              </label>
              <label>
                Perfil de acesso
                <select name="role" defaultValue="seller">
                  {roles.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Senha inicial
                <div className="settings-password">
                  <input
                    name="password"
                    type={show ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="No mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    aria-label={
                      show ? "Ocultar senha inicial" : "Mostrar senha inicial"
                    }
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              {error && (
                <p role="alert" className="settings-feedback error">
                  {error}
                </p>
              )}
              <button className="primary" disabled={busy} type="submit">
                {busy ? "Cadastrando…" : "Cadastrar usuário"}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
