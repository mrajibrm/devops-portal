import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, RefreshCw, Lock, Shield, Edit2, UserPlus, Check, X, Trash2, Power, AlertTriangle } from 'lucide-react';

const AdminUserManagement = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState(null);

    // Form State
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'user',
        full_name: '',
        phone: '',
        designation: '',
        department: '',
        autoGenerate: true
    });

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('/api/auth/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                console.error("API response is not an array:", res.data);
                setUsers([]);
                setError("Backend API mismatch. Please rebuild auth-service container.");
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
            setError("Failed to fetch users. Ensure you have Admin privileges.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError(null);

        const payload = { ...newUser };
        if (newUser.autoGenerate) {
            delete payload.password; // Backend will generate if missing
        }

        try {
            const res = await axios.post('/api/auth/admin/users', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', role: 'user', full_name: '', phone: '', designation: '', department: '', autoGenerate: true });
            fetchUsers();

            if (res.data.tempPassword) {
                alert(`User Created!\n\nUSERNAME: ${res.data.username}\nPASSWORD: ${res.data.tempPassword}\n\nPlease copy this password and share it with the user.`);
            } else {
                alert(`User Created: ${res.data.username}`);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to create user");
        }
    };

    const handleResetPassword = async (userId) => {
        if (!window.confirm("Are you sure you want to reset this user's password?")) return;
        try {
            const res = await axios.post(`/api/auth/admin/users/${userId}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Password reset! Temporary password: ${res.data.tempPassword}`);
        } catch (err) {
            console.error(err);
            alert("Failed to reset password");
        }
    };

    const handleEditClick = (user) => {
        setEditingUser({ ...user }); // Create a copy
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await axios.put(`/api/auth/admin/users/${editingUser.id}`, editingUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
            alert(`User updated successfully!`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to update user");
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user "${username}"?\n\nThis action cannot be undone.`)) return;

        try {
            await axios.delete(`/api/auth/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
            alert(`User "${username}" deleted.`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to delete user");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-indigo-400">
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage system users, roles, and access.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all shadow-lg hover:shadow-brand-500/25"
                >
                    <UserPlus size={18} />
                    <span>Create User</span>
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-2">
                    <X size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 animate-pulse">Loading users...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Contact</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                {u.username.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{u.full_name || u.username}</div>
                                                <div className="text-xs text-slate-500">@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">
                                        <div>{u.email}</div>
                                        <div className="text-xs text-slate-600">{u.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border
                                            ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                u.role === 'devops' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {u.role === 'admin' && <Shield size={10} className="mr-1" />}
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${u.is_active !== false
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {u.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">
                                        <div className="font-medium text-slate-300">{u.department || '-'}</div>
                                        <div className="text-xs text-slate-600">{u.designation}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleResetPassword(u.id)}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                                title="Reset Password"
                                            >
                                                <Lock size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                                title="Edit User"
                                                onClick={() => handleEditClick(u)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 text-red-400 hover:text-white hover:bg-red-600 rounded transition-colors"
                                                title="Delete User"
                                                onClick={() => handleDeleteUser(u.id, u.username)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-xl font-bold text-white">Add New User</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-600">Username will be derived from email</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-medium text-slate-400 uppercase">Password</label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newUser.autoGenerate}
                                                onChange={e => setNewUser({ ...newUser, autoGenerate: e.target.checked })}
                                                className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500"
                                            />
                                            <span className="text-[10px] text-slate-400">Auto-generate</span>
                                        </label>
                                    </div>
                                    <input
                                        type="password"
                                        required={!newUser.autoGenerate}
                                        disabled={newUser.autoGenerate}
                                        className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors ${newUser.autoGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newUser.password}
                                        placeholder={newUser.autoGenerate ? "(Auto-generated)" : ""}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Designation</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={newUser.designation}
                                        onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Department</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={newUser.department}
                                        onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={newUser.phone}
                                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder="+1..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Role</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="devops">DevOps Engineer</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-brand-500/20"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-xl font-bold text-white">Edit User</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            {/* Active/Inactive Toggle */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Account Status</div>
                                    <div className="text-xs text-slate-500">Deactivated users cannot login.</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={editingUser.is_active !== false}
                                        onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Username (Read-Only)</label>
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-slate-500 cursor-not-allowed"
                                        value={editingUser.username || ''}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Email (Read-Only)</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-slate-500 cursor-not-allowed"
                                        value={editingUser.email || ''}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    value={editingUser.full_name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Designation</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={editingUser.designation || ''}
                                        onChange={e => setEditingUser({ ...editingUser, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Department</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={editingUser.department || ''}
                                        onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={editingUser.phone || ''}
                                        onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Role</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        value={editingUser.role || 'user'}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="devops">DevOps Engineer</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-brand-500/20"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
