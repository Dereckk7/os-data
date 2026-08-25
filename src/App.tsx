import { type ReactNode, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AmbientDataBackground from './components/background';
import { AppShell } from './components/navigation';
import { Toaster } from './components/toast';
import {
  ApprovalsProvider,
  AuthProvider,
  getOnboarded,
  SourcesProvider,
  useAuth,
} from './lib/services';
import { PrefsProvider, ThemeProvider } from './lib/theme';
import Activity from './pages/Activity';
import AgentDetail from './pages/AgentDetail';
import Agents from './pages/Agents';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Cowork from './pages/Cowork';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Insights from './pages/Insights';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Operations from './pages/Operations';
import Planning from './pages/Planning';
import Reports from './pages/Reports';
import RequestDetail from './pages/RequestDetail';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import Sources from './pages/Sources';
import Tasks from './pages/Tasks';
import Validation from './pages/Validation';

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
  if (!getOnboarded() && location.pathname !== '/onboarding')
    return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingGate() {
  const { user } = useAuth();
  if (user && getOnboarded()) return <Navigate to="/dashboard" replace />;
  return <Onboarding />;
}

export default function App() {
  useEffect(() => {
    document.title = 'DATA OS — Votre entreprise, enfin connectée';
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
              </HashRouter>
            </ApprovalsProvider>
          </SourcesProvider>
        </AuthProvider>
      </PrefsProvider>
    </ThemeProvider>
  );
}
