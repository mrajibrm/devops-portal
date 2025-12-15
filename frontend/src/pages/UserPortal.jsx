import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Server, Activity, Shield } from 'lucide-react';

const UserPortal = () => {
    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'create'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchTickets();
        fetchTemplates();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await axios.get('/api/tickets', { headers: { Authorization: `Bearer ${token}` } });
            setTickets(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/catalog/templates'); // Public or Auth? Gateway handles it.
            setTemplates(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        const payload = {
            title: `${selectedTemplate.name} - ${formData[selectedTemplate.fields[0].name] || 'Request'}`,
            description: JSON.stringify(formData, null, 2), // Storing form data as JSON in description for simplicity
            severity: selectedTemplate.severity_default,
        };

        try {
            await axios.post('/api/tickets', payload, { headers: { Authorization: `Bearer ${token}` } });
            setView('list');
            fetchTickets();
            setSelectedTemplate(null);
            setFormData({});
        } catch (err) { alert('Failed to create ticket'); }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            OPEN: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10',
            IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
            RESOLVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
        };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[status]}`}>{status}</span>;
    };

    // Stunner Creation View
    if (view === 'create') {
        return (
            <div className="animate-fade-in pb-20">
                <button onClick={() => { setView('list'); setSelectedTemplate(null); }} className="mb-8 btn-ghost flex items-center gap-2">
                    <span>←</span> Back to Dashboard
                </button>

                {!selectedTemplate ? (
                    <div className="max-w-5xl mx-auto text-center">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">What do you need help with?</h1>
                        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">Select a service from our catalog to get started. We'll guide you through the rest.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplate(tmpl)}
                                    className="group relative bg-white rounded-2xl p-8 shadow-saas-md hover:shadow-saas-lg border border-slate-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                                    <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300 mx-auto">
                                        {tmpl.category === 'Infrastructure' ? <Server /> : tmpl.category === 'IAM' ? <Shield /> : <Activity />}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{tmpl.name}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{tmpl.description}</p>

                                    <div className="mt-6 text-brand-600 font-medium text-sm flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        Start Request <span>→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-saas-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                                <p className="text-sm text-slate-500">Please provide the details below.</p>
                            </div>
                            <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Change Service</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            {selectedTemplate.fields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">{field.label}</label>
                                    {field.type === 'select' ? (
                                        <div className="relative">
                                            <select
                                                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="input-field appearance-none"
                                            >
                                                <option value="">Select option...</option>
                                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type === 'number' ? 'number' : 'text'}
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="input-field"
                                            placeholder={`Ex: ${field.label}...`}
                                            required
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setSelectedTemplate(null)} className="btn-secondary w-1/3">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 shadow-glow hover:shadow-glow/80">Submit Request</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // Default List View
    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage your service tickets.</p>
                </div>
                <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> New Request
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-saas-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket ID</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3 font-mono text-xs text-slate-500">{t.id.slice(0, 8)}</td>
                                <td className="px-6 py-3 font-medium text-slate-900">{t.title}</td>
                                <td className="px-6 py-3"><StatusBadge status={t.status} /></td>
                                <td className="px-6 py-3 text-sm text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No tickets found. Create one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserPortal;
