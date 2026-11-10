import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { GoToServicePage } from './pages/GoToServicePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupAccountPage } from './pages/auth/SignupAccountPage';
import { SignupDonePage } from './pages/auth/SignupDonePage';
import { SignupTermsPage } from './pages/auth/SignupTermsPage';
import { AuthProvider, SignupProvider } from './state/AuthState';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          {/* MVP: 처음 온 사람도 구독 화면(권희수 님 페이지)부터 본다. 시작할 때 로그인은 bridge/prototypeAuth.ts가 받는다 */}
          <Route path="/" element={<GoToServicePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupProvider><Outlet /></SignupProvider>}>
            <Route index element={<SignupAccountPage />} />
            <Route path="terms" element={<SignupTermsPage />} />
            <Route path="done" element={<SignupDonePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
