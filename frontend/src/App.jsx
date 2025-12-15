import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LayoutDashboard, Ticket, LogOut, Terminal, Layers, PlusCircle, Settings, User } from 'lucide-react';

// Pages
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import EngineerCockpit from './pages/EngineerCockpit';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Only show sidebar if user is logged in
    if (!user) return null;

    const navLinkClass = ({ isActive }) =>
        `nav-item ${isActive ? 'bg-brand-600 text-white shadow-lg' : ''}`;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-brand-400">
                    <Terminal size={24} strokeWidth={2.5} />
                    <span className="text-lg font-bold tracking-tight text-white">DevOps<span className="text-brand-400">Portal</span></span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</div>

                {['user', 'admin'].includes(user.role) && (
                    <NavLink to="/portal" className={navLinkClass}>
                        <LayoutDashboard size={18} />
                        <span>My Portal</span>
                    </NavLink>
                )}

                {['devops', 'admin'].includes(user.role) && (
                    <NavLink to="/cockpit" className={navLinkClass}>
                        <Layers size={18} />
                        <span>Engineer Cockpit</span>
                    </NavLink>
                )}

                <div className="my-4 border-t border-white/5"></div>

                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                <a href="#" className="nav-item cursor-not-allowed opacity-50">
                    <Settings size={18} />
                    <span>Settings</span>
                </a>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium truncate">{user.username}</div>
                        <div className="text-xs text-slate-400 uppercase truncate">{user.role}</div>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-white transition-colors" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

const Layout = ({ children }) => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className={`flex-1 transition-all duration-300 ${user ? 'ml-64' : ''}`}>
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <Layout>
                        <Routes>
                            <Route path="/login" element={<Login />} />
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
                    </Layout>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;
