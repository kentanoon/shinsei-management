import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetail from './pages/ProjectDetail';
import SchedulePage from './pages/SchedulePage';
import FinancialPage from './pages/FinancialPage';
import Applications from './pages/Applications';
import DatabaseAdmin from './pages/DatabaseAdmin';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import theme from './theme';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<ProjectList />} />
                <Route path="projects/new" element={<ProjectCreate />} />
                <Route path="projects/:projectCode" element={<ProjectDetail />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="financial" element={<FinancialPage />} />
                <Route path="applications" element={<Applications />} />
                <Route path="admin/database" element={<DatabaseAdmin />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;