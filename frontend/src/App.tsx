import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Navbar from './components/layout/Navbar.tsx';
import ScrollNavigator from './components/ScrollNavigator.tsx';
import GlobalLoginButton from './components/GlobalLoginButton.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import SahalCardPage from './pages/SahalCardPage.tsx';
import ContactPage from './pages/ContactPage.tsx';
import GetSahalCardPage from './pages/GetSahalCardPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import DashboardPage from './pages/dashboard/DashboardPage.tsx';
import MarketerDashboardPage from './pages/dashboard/MarketerDashboardPage.tsx';
import ProfilePage from './pages/dashboard/ProfilePage.tsx';
import CompanyManagementPage from './pages/CompanyManagementPage.tsx';
import TixraacPage from './pages/TixraacPage.tsx';

// Context
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen">
                <Navbar />
                <GlobalLoginButton />

                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/marketer/dashboard" element={
                    <ProtectedRoute>
                      <MarketerDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/companies" element={
                    <ProtectedRoute requireAdmin={true}>
                      <CompanyManagementPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/get-sahal-card" element={<GetSahalCardPage />} />
                  <Route path="/tixraac" element={<TixraacPage />} />
                  <Route path="/*" element={
                    <ScrollNavigator>
                      {/* Home Section */}
                      <section id="home" data-snap-section className="h-screen">
                        <HomePage />
                      </section>

                      {/* About Section */}
                      <section id="about" data-snap-section className="h-screen">
                        <AboutPage />
                      </section>



                      {/* Sahal Card Section */}
                      <section id="sahal-card" data-snap-section className="min-h-screen">
                        <SahalCardPage />
                      </section>

                      {/* Contact Section */}
                      <section id="contact" data-snap-section className="h-screen">
                        <ContactPage />
                      </section>

                    </ScrollNavigator>
                  } />
                </Routes>

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '15px',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      transform: 'translateY(0)',
                      opacity: '1',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#ffffff',
                        secondary: '#10b981',
                      },
                      style: {
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '15px',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'hidden',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ffffff',
                        secondary: '#ef4444',
                      },
                      style: {
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '15px',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                      },
                    },
                  }}
                />

              </div>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;