import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sun, Moon, Terminal, LogOut } from 'lucide-react';

// Pages (to be implemented)
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import EngineerCockpit from './pages/EngineerCockpit';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-border shadow-sm" style={{ backdropFilter: 'blur(10px)', background: 'rgba(22, 27, 34, 0.8)' }}>
            <div className="flex items-center gap-2">
                <Terminal className="text-accent" />
                <span className="text-lg font-bold tracking-tight">DevOps<span className="text-accent">Portal</span></span>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {user && (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden sm:block">
                            <div className="font-medium text-primary">{user.username}</div>
                            <div className="text-xs text-secondary uppercase">{user.role}</div>
                        </div>
                        <button onClick={logout} className="p-2 text-danger hover:bg-danger/10 rounded-full" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

const App = () => {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <div className="min-h-screen transition-colors duration-300">
                        <Navbar />
                        <main className="container mx-auto py-8">
                            <Routes>
                                <Route path="/login" element={<Login />} />

                                {/* Redirect root based on role is handled in Login or Dashboard, simple redirect for now */}
                                <Route path="/" element={<Navigate to="/login" />} />

                                <Route path="/portal" element={
                                    <ProtectedRoute roles={['user', 'admin']}>
                                        <UserPortal />
                                    </ProtectedRoute>
                                } />

                                <Route path="/cockpit" element={
                                    <ProtectedRoute roles={['devops', 'admin']}>
                                        <EngineerCockpit />
                                    </ProtectedRoute>
                                } />

                            </Routes>
                        </main>
                    </div>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;
