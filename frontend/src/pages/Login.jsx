import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            // Decode role better in real app, here we guess or check storage
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'devops' || user.role === 'admin') {
                navigate('/cockpit');
            } else {
                navigate('/portal');
            }
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-slate-50">
            <div className="card w-full max-w-md shadow-lg border-t-4 border-brand-500 relative overflow-hidden">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0f62fe 1px, transparent 1px), linear-gradient(90deg, #0f62fe 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10 p-2">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-4">
                            <User size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                        <p className="text-slate-500 text-sm mt-2">Sign in to your corporate portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-brand-500/50" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 bg-bg-secondary w-full"
                                    placeholder="e.g. alice"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-brand-500/50" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-bg-secondary w-full"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="text-danger text-sm text-center bg-danger/10 p-2 rounded">{error}</div>}

                        <button type="submit" className="btn w-full py-2.5 text-base">
                            Authenticate
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-secondary">
                        <p>Demo Credentials:</p>
                        <p>alice / user123 (User)</p>
                        <p>bob / devops123 (DevOps)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
