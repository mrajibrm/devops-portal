import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Server, Activity, Shield } from 'lucide-react';

const UserPortal = () => {
    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [activeTab, setActiveTab] = useState('my-requests'); // 'my-requests' | 'new-request'
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
            setActiveTab('my-requests');
            fetchTickets();
            setSelectedTemplate(null);
            setFormData({});
        } catch (err) { alert('Failed to create ticket'); }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            OPEN: 'bg-blue-100 text-blue-600',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
            RESOLVED: 'bg-green-100 text-green-600'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Portal</h1>
                    <p className="text-secondary mt-1">Manage your requests and services</p>
                </div>
                <button
                    onClick={() => setActiveTab('new-request')}
                    className="bg-apple-blue hover:bg-blue-600 text-white rounded-full px-6 py-2.5 font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} /> New Request
                </button>
            </div>

            {activeTab === 'new-request' && (
                <div className="mb-10 animate-fade-in">

                    {!selectedTemplate ? (
                        <>
                            <h2 className="text-xl font-semibold mb-6">Service Catalog</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {templates.map(tmpl => (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => setSelectedTemplate(tmpl)}
                                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md group"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 rounded-2xl bg-gray-50 text-apple-blue group-hover:bg-blue-50 transition-colors">
                                                {tmpl.category === 'Infrastructure' ? <Server size={24} /> : tmpl.category === 'IAM' ? <Shield size={24} /> : <Activity size={24} />}
                                            </div>
                                            <span className="font-semibold text-secondary text-sm uppercase tracking-wider">{tmpl.category}</span>
                                        </div>
                                        <h3 className="font-bold text-xl mb-2 text-apple-dark">{tmpl.name}</h3>
                                        <p className="text-secondary text-sm leading-relaxed">{tmpl.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                            <div className="mb-6 flex items-center gap-2 text-secondary cursor-pointer hover:text-apple-blue transition-colors" onClick={() => setSelectedTemplate(null)}>
                                <span>←</span> Back to Catalog
                            </div>
                            <h3 className="text-2xl font-bold mb-8 text-apple-dark flex items-center gap-3">
                                <span className="p-2 bg-blue-50 rounded-xl text-apple-blue">
                                    {selectedTemplate.category === 'Infrastructure' ? <Server size={20} /> : selectedTemplate.category === 'IAM' ? <Shield size={20} /> : <Activity size={20} />}
                                </span>
                                {selectedTemplate.name}
                            </h3>

                            <form onSubmit={handleCreate} className="space-y-6">
                                {selectedTemplate.fields.map(field => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-semibold text-secondary mb-2">{field.label}</label>
                                        {field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-apple-blue/50 outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Select an option...</option>
                                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-3.5 pointer-events-none text-secondary">▼</div>
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-apple-blue/50 outline-none transition-all"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-apple-dark text-white rounded-xl py-3.5 font-semibold hover:bg-black transition-transform active:scale-95">
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold">My Requests</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-secondary text-xs uppercase tracking-wider font-semibold">
                                <th className="px-8 py-4">ID</th>
                                <th className="px-8 py-4">Title</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tickets.map(t => (
                                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-4 font-mono text-xs text-secondary group-hover:text-apple-blue">{t.id.slice(0, 8)}...</td>
                                    <td className="px-8 py-4 font-medium text-apple-dark">{t.title}</td>
                                    <td className="px-8 py-4"><StatusBadge status={t.status} /></td>
                                    <td className="px-8 py-4 text-sm text-secondary">{new Date(t.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {tickets.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-secondary">
                                        <p className="text-lg mb-2">No requests found</p>
                                        <p className="text-sm">Start by creating a new request above.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserPortal;
