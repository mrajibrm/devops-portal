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
        <nav className="sticky top-0 z-50 glass border-b border-gray-100 mb-6">
            <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="bg-black text-white p-2 rounded-lg">
                        <Terminal size={20} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-apple-dark">DevOps<span className="text-apple-blue">Hub</span></span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-secondary">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {user && (
                        <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                            <div className="text-sm text-right hidden sm:block">
                                <div className="font-semibold text-apple-dark">{user.username}</div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wide">{user.role}</div>
                            </div>
                            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Logout">
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
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
