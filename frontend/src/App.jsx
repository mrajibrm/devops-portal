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
        `nav-item ${isActive ? 'active' : ''}`;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-brand-900 text-white flex flex-col z-50 shadow-2xl border-r border-brand-800">
            {/* Logo Area - Centered */}
            <div className="h-20 flex items-center justify-center px-6 border-b border-brand-800 bg-brand-950">
                <div className="flex items-center gap-2 text-brand-300">
                    <Terminal size={26} strokeWidth={2.5} />
                    <span className="text-xl font-bold tracking-tight text-white">DevOps<span className="text-brand-300">Portal</span></span>
                </div>
            </div>

            {/* Navigation - Spaced Evenly */}
            <nav className="flex-1 py-8 px-4 flex flex-col gap-4">
                <div className="px-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Menu</div>

                {['user', 'admin'].includes(user.role) && (
                    <NavLink to="/portal" className={navLinkClass}>
                        <LayoutDashboard size={20} />
                        <span className="text-base">My Portal</span>
                    </NavLink>
                )}

                {['devops', 'admin'].includes(user.role) && (
                    <NavLink to="/cockpit" className={navLinkClass}>
                        <Layers size={20} />
                        <span className="text-base">Engineer Cockpit</span>
                    </NavLink>
                )}

                <div className="my-2 border-t border-white/5"></div>

                <div className="px-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">System</div>
                <a href="#" className="nav-item cursor-not-allowed opacity-50">
                    <Settings size={20} />
                    <span className="text-base">Settings</span>
                </a>
            </nav>

            {/* User Profile - Aligned with Icon */}
            <div className="p-4 bg-brand-950/30 border-t border-brand-800">
                <div className="flex items-center gap-3 bg-brand-800/40 p-3 rounded-lg border border-brand-700/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg">
                        <User size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{user.username}</div>
                        <div className="text-xs text-brand-200 uppercase truncate font-medium">{user.role}</div>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Logout">
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
