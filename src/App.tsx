import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AuthProvider, ApprovalsProvider, getOnboarded, SourcesProvider, useAuth,
} from "./lib/services";
import { PrefsProvider, ThemeProvider } from "./lib/theme";
import { Toaster } from "./components/toast";
import AmbientDataBackground from "./components/background";
import { AppShell } from "./components/navigation";

/* Code-splitting : chaque page devient un chunk chargé à la demande, ce qui
   allège le bundle initial. Les routes et la logique sont inchangées ;
   Suspense affiche un repli le temps du chargement du chunk. */
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Requests = lazy(() => import("./pages/Requests"));
const RequestDetail = lazy(() => import("./pages/RequestDetail"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Agents = lazy(() => import("./pages/Agents"));
const AgentDetail = lazy(() => import("./pages/AgentDetail"));
const Operations = lazy(() => import("./pages/Operations"));
const Insights = lazy(() => import("./pages/Insights"));
const Reports = lazy(() => import("./pages/Reports"));
const Sources = lazy(() => import("./pages/Sources"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Documents = lazy(() => import("./pages/Documents"));
const Activity = lazy(() => import("./pages/Activity"));
const Cowork = lazy(() => import("./pages/Cowork"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Planning = lazy(() => import("./pages/Planning"));
const Validation = lazy(() => import("./pages/Validation"));
const Settings = lazy(() => import("./pages/Settings"));

/* Repli plein écran (routes hors coquille : Login / Onboarding). */
function RouteFallback() {
  return (
    <div className="relative z-10 grid min-h-screen place-items-center">
      <span className="pulse-dot num text-[10px] uppercase tracking-[0.24em] text-cream/50">Chargement…</span>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="relative z-10 grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="pulse-dot num text-[10px] uppercase tracking-[0.24em] text-cream/35">
            Initialisation du système
          </span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!getOnboarded() && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingGate() {
  const { user } = useAuth();
  if (user && getOnboarded()) return <Navigate to="/dashboard" replace />;
  return <Onboarding />;
}

export default function App() {
  useEffect(() => {
    document.title = "DATA OS — Votre entreprise, enfin connectée";
  }, []);

  return (
    <ThemeProvider>
      <PrefsProvider>
        <AuthProvider>
          <SourcesProvider>
            <ApprovalsProvider>
              <HashRouter>
                <AmbientDataBackground />
                <Toaster />
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/onboarding"
                    element={
                      <RequireAuth>
                        <OnboardingGate />
                      </RequireAuth>
                    }
                  />
                  <Route
                    element={
                      <RequireAuth>
                        <AppShell />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/requests/:id" element={<RequestDetail />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/agents/:id" element={<AgentDetail />} />
                    <Route path="/operations" element={<Operations />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/sources" element={<Sources />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/cowork" element={<Cowork />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/planning" element={<Planning />} />
                    <Route path="/validation" element={<Validation />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                </Suspense>
              </HashRouter>
            </ApprovalsProvider>
          </SourcesProvider>
        </AuthProvider>
      </PrefsProvider>
    </ThemeProvider>
  );
}
