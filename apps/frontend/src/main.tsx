import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import KanbanBoard from './pages/KanbanBoard'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './context/AuthContext'
import { TaskProvider } from './context/TaskContext'
import { UserProvider } from './context/UserContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TrpcProvider } from './trpcProvider'
import UserManagement from './pages/UserManagement';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrpcProvider>
      <AuthProvider>
        <ErrorBoundary>
          <UserProvider>
            <TaskProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/" element={<KanbanBoard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TaskProvider>
          </UserProvider>
        </ErrorBoundary>
      </AuthProvider>
    </TrpcProvider>
  </StrictMode>,
)
