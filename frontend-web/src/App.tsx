import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import IncidentsPage from './pages/IncidentsPage';
import CorrelationPage from './pages/CorrelationPage';
import SimpleRegressionPage from './pages/SimpleRegressionPage';
import MultiRegressionPage from './pages/MultiRegressionPage';
import AssistantPage from './pages/AssistantPage';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>;

  return (
    <Routes>
      {/* Publica */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />

      {/* Protegida (admin) */}
      <Route element={<ProtectedRoute isAdminRoute />}>
        <Route element={<DashboardLayout />}>
          {/* index === "/" */}
          <Route index element={<OverviewPage />} />
          <Route path="incidents" element={<IncidentsPage />} />

          {/* Análisis */}
          <Route path="analytics" element={<CorrelationPage />} />
          <Route path="analysis/regression" element={<SimpleRegressionPage />} />
          <Route path="analysis/multi-regression" element={<MultiRegressionPage />} />

          {/* Asistente */}
          <Route path="assistant" element={<AssistantPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
