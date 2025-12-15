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
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="card w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-center mb-8">Access <span className="text-accent">Portal</span></h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-secondary" size={18} />
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
                            <label className="block text-sm font-medium text-secondary mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-secondary" size={18} />
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
