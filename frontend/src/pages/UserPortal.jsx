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
        const colors = { OPEN: 'bg-info/20 text-info', IN_PROGRESS: 'bg-warning/20 text-warning', RESOLVED: 'bg-success/20 text-success' };
        return <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status] || 'bg-secondary/20'}`}>{status}</span>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">User Portal</h1>
                <button onClick={() => setActiveTab('new-request')} className="btn flex items-center gap-2">
                    <Plus size={16} /> New Request
                </button>
            </div>

            {activeTab === 'new-request' && (
                <div className="mb-8 card border-accent/30">
                    <h2 className="text-xl font-bold mb-4">Create New Request</h2>

                    {!selectedTemplate ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {templates.map(tmpl => (
                                <div key={tmpl.id} onClick={() => setSelectedTemplate(tmpl)} className="card hover:border-accent cursor-pointer transition-all hover:-translate-y-1">
                                    <div className="flex items-center gap-2 mb-2 text-accent">
                                        {tmpl.category === 'Infrastructure' ? <Server size={20} /> : tmpl.category === 'IAM' ? <Shield size={20} /> : <Activity size={20} />}
                                        <span className="font-bold">{tmpl.category}</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{tmpl.name}</h3>
                                    <p className="text-secondary text-sm">{tmpl.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="max-w-xl">
                            <div className="mb-4 text-secondary cursor-pointer hover:text-primary" onClick={() => setSelectedTemplate(null)}>← Back to Catalog</div>
                            <h3 className="text-lg font-bold mb-4 text-accent">{selectedTemplate.name}</h3>

                            {selectedTemplate.fields.map(field => (
                                <div key={field.name} className="mb-4">
                                    <label className="block text-sm font-medium mb-1">{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="w-full"
                                        >
                                            <option value="">Select...</option>
                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type === 'number' ? 'number' : 'text'}
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            ))}

                            <button type="submit" className="btn mt-4">Submit Request</button>
                        </form>
                    )}
                </div>
            )}

            <div className="card">
                <h2 className="text-lg font-bold mb-4">My Requests</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border text-secondary text-sm">
                                <th className="pb-2">ID</th>
                                <th className="pb-2">Title</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tickets.map(t => (
                                <tr key={t.id} className="hover:bg-bg-secondary/50">
                                    <td className="py-3 font-mono text-xs text-secondary">{t.id.slice(0, 8)}...</td>
                                    <td className="py-3 font-medium">{t.title}</td>
                                    <td className="py-3"><StatusBadge status={t.status} /></td>
                                    <td className="py-3 text-sm text-secondary">{new Date(t.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {tickets.length === 0 && <tr><td colSpan="4" className="py-4 text-center text-secondary">No requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserPortal;
