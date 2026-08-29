/**
 * PageErrorBoundary — barrière d'erreur au niveau du CONTENU de page.
 * Contrairement au RootErrorBoundary (qui remplace toute l'app), celle-ci
 * n'isole que la zone <Outlet /> : la navigation (sidebar, header) reste
 * intacte, et un simple changement de route (clé = pathname) suffit à
 * repartir sans rechargement. Le RootErrorBoundary reste le filet ultime.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Journalisation d'erreur intentionnelle (pas un log de debug).
    console.error("DATA OS — erreur de page :", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] text-cream/50 shadow-[var(--highlight-top)]">
            <RotateCcw size={18} strokeWidth={1.6} />
          </span>
          <p className="mt-4 t-section text-[17px]">Cette page a rencontré un problème</p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-cream/50">
            L'affichage a été interrompu. Vous pouvez réessayer, ou changer de page — le reste de l'application reste opérationnel.
          </p>
          <button
            onClick={this.reset}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-sm bg-cream px-4 text-[13px] font-[590] text-ink-950 transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            <RotateCcw size={14} strokeWidth={1.9} /> Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
