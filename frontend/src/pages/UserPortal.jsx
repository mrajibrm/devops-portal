import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Plus, Server, Activity, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const UserPortal = () => {
    const { token } = useAuth();
    const { tickets, createTicket } = useTickets();
    const [templates, setTemplates] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'create'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchTemplates();
    }, []);

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
            await createTicket(payload);
            setView('list');
            setSelectedTemplate(null);
            setFormData({});
        } catch (err) { alert('Failed to create ticket'); }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'OPEN':
                return (
                    <div className="flex items-center gap-2 text-brand-600">
                        <AlertCircle size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Open</span>
                    </div>
                );
            case 'IN_PROGRESS':
                return (
                    <div className="flex items-center gap-2 text-amber-600">
                        <Clock size={18} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                    </div>
                );
            case 'RESOLVED':
                return (
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                    </div>
                );
            default:
                return <span className="text-slate-500">{status}</span>;
        }
    };

    // Stunner Creation View
    if (view === 'create') {
        return (
            <div className="animate-fade-in pb-20">
                <button onClick={() => { setView('list'); setSelectedTemplate(null); }} className="mb-8 btn-ghost flex items-center gap-2">
                    <span>←</span> Back to Dashboard
                </button>

                {!selectedTemplate ? (
                    <div className="max-w-6xl mx-auto text-center">
                        <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Service Catalog</h1>
                        <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto">Select a service to initiate a new request.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplate(tmpl)}
                                    className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-slate-200 cursor-pointer transition-all duration-200 hover:border-brand-300 text-left flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-50 text-brand-600 flex items-center justify-center text-2xl group-hover:bg-brand-50 transition-colors">
                                            {tmpl.category === 'Infrastructure' ? <Server size={24} /> : tmpl.category === 'IAM' ? <Shield size={24} /> : <Activity size={24} />}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 px-2 py-1 rounded-full bg-slate-50">{tmpl.category}</span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{tmpl.name}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{tmpl.description}</p>

                                    <div className="pt-4 border-t border-slate-50 flex items-center text-brand-600 text-sm font-semibold gap-2 group-hover:gap-3 transition-all">
                                        Start Request <span className="text-lg leading-none">→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-saas-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white border border-slate-200 rounded-lg text-brand-600">
                                    {selectedTemplate.category === 'Infrastructure' ? <Server size={20} /> : selectedTemplate.category === 'IAM' ? <Shield size={20} /> : <Activity size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                                    <p className="text-sm text-slate-500">Authorized request form</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Change Service</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {selectedTemplate.fields.map(field => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">{field.label} <span className="text-red-500">*</span></label>
                                        {field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                                    className="input-field appearance-none bg-slate-50"
                                                    required
                                                >
                                                    <option value="">Select...</option>
                                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="input-field bg-slate-50"
                                                placeholder={`Enter details...`}
                                                required
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-slate-100">
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">Ticket ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">Subject</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {tickets.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 border-r border-slate-200 last:border-r-0 font-medium">
                                    {t.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200 last:border-r-0">
                                    {t.title}
                                </td>
                                <td className="px-6 py-4 border-r border-slate-200 last:border-r-0">
                                    <StatusBadge status={t.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-16 text-center text-slate-400 italic bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertCircle size={24} className="opacity-20" />
                                        <span>No tickets found. Create one to get started.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserPortal;
