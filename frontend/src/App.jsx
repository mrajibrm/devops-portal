import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TicketProvider } from './context/TicketContext';
import { LayoutDashboard, Ticket, LogOut, Terminal, Layers, PlusCircle, Settings as SettingsIcon, User, ChevronLeft, ChevronRight } from 'lucide-react';

// Pages
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import EngineerCockpit from './pages/EngineerCockpit';
import AdminUserManagement from './pages/AdminUserManagement';
import Settings from './pages/Settings';

const Sidebar = ({ collapsed, toggle }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Only show sidebar if user is logged in
    if (!user) return null;

    const navLinkClass = ({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`;

    return (
        <aside className={`fixed left-0 top-0 bottom-0 bg-brand-900 text-white flex flex-col z-50 shadow-2xl border-r border-brand-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo Area */}
            <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'justify-center px-6'} border-b border-brand-800 bg-brand-950 transition-all`}>
                <div className="flex items-center gap-2 text-brand-300 overflow-hidden">
                    <Terminal size={26} strokeWidth={2.5} className="flex-shrink-0" />
                    {!collapsed && <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap opacity-100 transition-opacity duration-200">
                        DevOps<span className="text-brand-300">Hub</span>
                    </span>}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-3 flex flex-col gap-4 overflow-x-hidden">
                {!collapsed && <div className="px-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Menu</div>}

                {['user', 'admin'].includes(user.role) && (
                    <NavLink to="/portal" className={navLinkClass} title={collapsed ? "My Portal" : ""}>
                        <LayoutDashboard size={20} className="flex-shrink-0" />
                        {!collapsed && <span className="text-base whitespace-nowrap">My Portal</span>}
                    </NavLink>
                )}

                {['devops', 'admin'].includes(user.role) && (
                    <NavLink to="/cockpit" className={navLinkClass} title={collapsed ? "Engineer Cockpit" : ""}>
                        <Layers size={20} className="flex-shrink-0" />
                        {!collapsed && <span className="text-base whitespace-nowrap">Engineer Cockpit</span>}
                    </NavLink>
                )}

                {user.role === 'admin' && (
                    <NavLink to="/admin/users" className={navLinkClass} title={collapsed ? "User Management" : ""}>
                        <User size={20} className="flex-shrink-0" />
                        {!collapsed && <span className="text-base whitespace-nowrap">Manage Users</span>}
                    </NavLink>
                )}

                <div className="my-2 border-t border-white/5"></div>

                {!collapsed && <div className="px-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">System</div>}
                <NavLink to="/settings" className={navLinkClass} title={collapsed ? "Settings" : ""}>
                    <SettingsIcon size={20} className="flex-shrink-0" />
                    {!collapsed && <span className="text-base whitespace-nowrap">Settings</span>}
                </NavLink>
            </nav>

            {/* Toggle Button */}
            <button
                onClick={toggle}
                className="mx-auto mb-4 p-1.5 rounded-full bg-brand-800 text-brand-300 hover:text-white hover:bg-brand-700 transition-colors border border-brand-700"
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* User Profile */}
            <div className={`p-4 bg-brand-950/30 border-t border-brand-800 transition-all ${collapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 bg-brand-800/40 p-2 rounded-lg border border-brand-700/50 ${collapsed ? 'justify-center flex-col gap-2' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <User size={20} />
                    </div>
                    {!collapsed && <div className="flex-1 overflow-hidden min-w-0">
                        <div className="text-sm font-bold text-white truncate">{user.username}</div>
                        <div className="text-xs text-brand-200 uppercase truncate font-medium">{user.role}</div>
                    </div>}
                    <button onClick={logout} className={`text-slate-400 hover:text-red-400 transition-colors ${collapsed ? 'mt-1' : 'p-2'}`} title="Logout">
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
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar collapsed={collapsed} toggle={() => setCollapsed(!collapsed)} />
            <main className={`flex-1 transition-all duration-300 ${user ? (collapsed ? 'ml-20' : 'ml-64') : ''}`}>
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
                    <TicketProvider>
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

                                <Route path="/admin/users" element={
                                    <ProtectedRoute roles={['admin']}>
                                        <AdminUserManagement />
                                    </ProtectedRoute>
                                } />

                                <Route path="/settings" element={
                                    <ProtectedRoute roles={['user', 'admin', 'devops']}>
                                        <Settings />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </Layout>
                    </TicketProvider>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;
