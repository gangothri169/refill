import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api/client';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { CopilotSidebar } from './components/CopilotSidebar';
import { NewRefillModal } from './components/NewRefillModal';
import { DemoGuidePill } from './components/DemoGuidePill';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { GrowthPage } from './pages/GrowthPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

// AppLayout now owns the Routes so it can pass the real modal handler to CasesPage
const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  // Sync unread notifications count with storage
  useEffect(() => {
    async function checkUnread() {
      try {
        const notifs = await api.getNotifications();
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter((n: any) => !n.read).length);
        }
      } catch {}
    }
    checkUnread();
  }, [location.pathname]);

  // Extract case ID if currently on a case detail page
  const caseMatch = location.pathname.match(/\/cases\/([^/]+)/);
  const currentCaseId = caseMatch ? caseMatch[1] : undefined;

  if (isLoginPage) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      {/* Ambient light blobs for glassmorphic depth */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Global Demo Environment Banner */}
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar
            onOpenCopilot={() => setCopilotOpen(!copilotOpen)}
            copilotOpen={copilotOpen}
            onOpenNewCase={() => setNewCaseModalOpen(true)}
            unreadNotificationsCount={unreadCount}
          />

          <main className="flex-1 overflow-y-auto">
            {/* Routes live here so CasesPage gets the real openNewCase handler */}
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/cases"
                element={<CasesPage onOpenNewCase={() => setNewCaseModalOpen(true)} />}
              />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/growth" element={<GrowthPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Right Drawer: RxResolve Copilot */}
      <CopilotSidebar
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentCaseId={currentCaseId}
      />

      {/* Global New Refill Modal — shared between Navbar button and CasesPage button */}
      <NewRefillModal
        isOpen={newCaseModalOpen}
        onClose={() => setNewCaseModalOpen(false)}
      />

      {/* Floating 7-Step Guided Demo Walkthrough */}
      <DemoGuidePill />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
