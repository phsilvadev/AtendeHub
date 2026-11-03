"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, X, Sparkles } from "lucide-react";
export const tourSteps = [
  {
    target: "navigation",
    title: "Tudo começa pelo menu",
    text: "Acesse atendimentos, orçamentos, clientes, produtos e relatórios. Use o ícone no cabeçalho para expandir o menu e ver os nomes.",
  },
  {
    target: "metrics",
    title: "Seu resumo comercial",
    text: "Acompanhe os atendimentos, orçamentos, vendas convertidas e novos clientes. Os indicadores ajudam a entender o movimento do dia.",
  },
  {
    target: "new-attendance",
    title: "Comece uma nova conversa",
    text: "Use este botão para registrar um atendimento e organizar a solicitação do cliente.",
  },
  {
    target: "conversations",
    title: "Fique por dentro das conversas",
    text: "Veja as últimas mensagens e o status de cada atendimento. Em “Visualizar conversa”, você pode abrir os detalhes.",
  },
  {
    target: "charts",
    title: "Acompanhe cada etapa",
    text: "Confira a evolução da conversão e como os atendimentos estão distribuídos por status.",
  },
  {
    target: "products",
    title: "Descubra o que desperta interesse",
    text: "Veja os produtos mais consultados e identifique oportunidades para sua equipe comercial.",
  },
  {
    target: "profile",
    title: "Sua conta, sempre à mão",
    text: "Abra seu perfil para acessar as preferências ou sair da conta. Você pode refazer este tour pelo botão “Tour guiado” sempre que precisar.",
  },
];
type Box = { left: number; top: number; width: number; height: number };
export function DashboardTour({
  storageKey,
  open,
  onClose,
}: {
  storageKey: string;
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const dialog = useRef<HTMLDivElement>(null);
  const close = useCallback(
    (status: string) => {
      try {
        localStorage.setItem(storageKey, status);
      } catch {}
      onClose();
    },
    [onClose, storageKey],
  );
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const background = document.querySelector<HTMLElement>(
      "[data-tour-background]",
    );
    const oldInert = background?.inert;
    const oldOverflow = document.body.style.overflow;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close("skipped");
      }
      if (event.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = oldOverflow;
      if (background) background.inert = oldInert ?? false;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, close]);
  useLayoutEffect(() => {
    if (!open) return;
    let element = document.querySelector<HTMLElement>(
      `[data-tour="${tourSteps[index].target}"]`,
    );
    if (window.innerWidth <= 700 && tourSteps[index].target === "charts")
      element = element?.querySelector<HTMLElement>(".conversion") || element;
    if (!element) {
      setBox(null);
      return;
    }
    if (window.innerWidth <= 700 && tourSteps[index].target === "conversations")
      element =
        element?.querySelector<HTMLElement>(".conversation-preview") || element;
    element.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
    if (window.innerWidth <= 700 && index > 0 && index < tourSteps.length - 1) {
      const rect = element.getBoundingClientRect();
      const dialogHeight = dialog.current?.offsetHeight || 300;
      if (rect.height + dialogHeight + 18 <= window.innerHeight - 90) {
        const desiredTop = Math.max(
          85,
          (window.innerHeight - rect.height - dialogHeight - 18) / 2,
        );
        window.scrollBy({ top: rect.top - desiredTop, behavior: "instant" });
      }
    }
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const padding = 7;
      const left = Math.max(5, rect.left - padding),
        top = Math.max(5, rect.top - padding);
      const right = Math.min(window.innerWidth - 5, rect.right + padding),
        bottom = Math.min(window.innerHeight - 5, rect.bottom + padding);
      setBox({
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer.disconnect();
    };
  }, [index, open]);
  useLayoutEffect(() => {
    if (!open || !box || !dialog.current) return;
    const width = dialog.current.offsetWidth,
      height = dialog.current.offsetHeight;
    const gap = 18;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    let left = box.left + box.width / 2 - width / 2,
      top = box.top + box.height + gap;
    if (index === 0 && vw > 700) {
      left = box.left + box.width + gap;
      top = box.top + 18;
    } else if (top + height > vh - 16) {
      if (box.top - height - gap >= 16) top = box.top - height - gap;
      else if (box.left + box.width + width + gap < vw - 16) {
        left = box.left + box.width + gap;
        top = box.top;
      } else top = vh - height - 16;
    }
    setPosition({
      left: Math.max(16, Math.min(vw - width - 16, left)),
      top: Math.max(16, Math.min(vh - height - 16, top)),
    });
  }, [box, index, open]);
  if (!open) return null;
  const step = tourSteps[index];
  return createPortal(
    <div className="tour-layer">
      <svg className="tour-shade" aria-hidden="true" width="100%" height="100%">
        <defs>
          <mask id="dashboard-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {box && (
              <rect
                {...{
                  x: box.left,
                  y: box.top,
                  width: box.width,
                  height: box.height,
                }}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(17,18,38,.73)"
          mask="url(#dashboard-tour-mask)"
        />
      </svg>
      {box && (
        <div
          className="tour-spotlight"
          data-testid="tour-spotlight"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          }}
        />
      )}
      <div
        ref={dialog}
        className="tour-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        tabIndex={-1}
        style={position}
      >
        <div className="tour-heading">
          <span>
            <Sparkles size={15} /> CONHEÇA O ATENDEHUB
          </span>
          <button
            aria-label="Fechar tour"
            className="tour-close"
            onClick={() => close("skipped")}
          >
            <X size={18} />
          </button>
        </div>
        <div className="tour-step-label">
          Passo {index + 1} de {tourSteps.length}
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-description">{step.text}</p>
        <div
          className="tour-progress"
          aria-label={`Etapa ${index + 1} de ${tourSteps.length}`}
        >
          {tourSteps.map((_, i) => (
            <span key={i} className={i <= index ? "filled" : ""} />
          ))}
        </div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={() => close("skipped")}>
            Pular tour
          </button>
          <div>
            <button
              className="tour-back"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
            <button
              className="tour-next"
              onClick={() =>
                index === tourSteps.length - 1
                  ? close("completed")
                  : setIndex(index + 1)
              }
            >
              {index === tourSteps.length - 1 ? "Concluir" : "Próximo"}
              {index === tourSteps.length - 1 ? (
                <Check size={15} />
              ) : (
                <ArrowRight size={15} />
              )}
            </button>
          </div>
        </div>
        <small className="tour-hint">
          Você pode reabrir este guia a qualquer momento.
        </small>
      </div>
    </div>,
    document.body,
  );
}
