import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ContactsPage } from './pages/Contacts';
import { CampaignsPage } from './pages/Campaigns';
import { TemplatesPage } from './pages/Templates';
import { ReportsPage } from './pages/Reports';

function AppLayout() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex">
      <Sidebar onLogout={logout} userName={user.name} />
      <main className="flex-1 ml-64 min-h-screen p-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
