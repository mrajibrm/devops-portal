import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Clock, Zap, AlertTriangle, CheckCircle, MoreHorizontal } from 'lucide-react';

const EngineerCockpit = () => {
    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pulse, setPulse] = useState(false); // Visual indicator for realtime event
    const wsRef = useRef(null);

    useEffect(() => {
        fetchTickets();
        setupWebSocket();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await axios.get('/api/tickets', { headers: { Authorization: `Bearer ${token}` } });
            setTickets(res.data || []);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const setupWebSocket = () => {
        // In dev, assuming proxy. In prod, full URL.
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/tickets/live`;

        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_TICKET' || msg.type === 'TICKET_UPDATED') {
                fetchTickets(); // Simple re-fetch strategy for consistency
                flashPulse();
            }
        };
    };

    const flashPulse = () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`/api/tickets/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            // WS will trigger re-fetch
        } catch (err) { alert('Update failed'); }
    };

    const triggerExternalFetch = async (id) => {
        const url = prompt("Enter External URL to fetch diagnostic data (e.g., http://safe-internal-metrics):");
        if (!url) return;
        try {
            const res = await axios.post(`/api/tickets/${id}/fetch`, { url }, { headers: { Authorization: `Bearer ${token}` } });
            alert(`Success: ${res.data.data}`);
        } catch (err) { alert('Fetch Blocked (SSRF Protection) or Failed.'); }
    };

    const KanbanColumn = ({ title, status, items }) => (
        <div className="flex-1 min-w-[320px] bg-gray-100/50 rounded-2xl p-4 border border-gray-100 backdrop-blur-sm">
            <h3 className="font-bold mb-4 flex justify-between px-2 items-center text-secondary uppercase tracking-tight text-sm">
                {title}
                <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm text-apple-dark">{items.length}</span>
            </h3>
            <div className="space-y-3">
                {items.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100 group relative">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                ${t.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                    t.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-50 text-blue-600'
                                }`}>
                                {t.severity}
                            </span>
                            <div className="text-secondary text-xs font-mono">{new Date(t.created_at).toLocaleTimeString()}</div>
                        </div>
                        <h4 className="font-bold text-apple-dark mb-2 leading-tight">{t.title}</h4>
                        <p className="text-secondary text-sm line-clamp-2 mb-4 leading-relaxed">{t.description}</p>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                            <div className="flex gap-2">
                                {status !== 'OPEN' && (
                                    <button onClick={() => updateStatus(t.id, 'OPEN')} className="p-1.5 rounded-full hover:bg-gray-100 text-secondary hover:text-apple-dark transition-colors" title="Move to Open">←</button>
                                )}
                                {status !== 'IN_PROGRESS' && status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'IN_PROGRESS')} className="px-3 py-1 rounded-full bg-blue-50 text-apple-blue font-semibold text-xs hover:bg-apple-blue hover:text-white transition-colors">Start</button>
                                )}
                                {status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'RESOLVED')} className="px-3 py-1 rounded-full bg-green-50 text-green-600 font-semibold text-xs hover:bg-green-500 hover:text-white transition-colors">Resolve</button>
                                )}
                            </div>
                            <button onClick={() => triggerExternalFetch(t.id)} className="p-2 rounded-full hover:bg-yellow-50 text-yellow-500 transition-colors" title="External Fetch">
                                <Zap size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="text-center text-sm text-secondary/50 italic py-8 border-2 border-dashed border-gray-200 rounded-xl mx-2">No tickets</div>}
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    Engineer Cockpit
                    {pulse && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 animate-pulse"><RefreshCw size={12} /> LIVE UPDATING</span>}
                </h1>
                <div className="flex gap-4">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm">
                        <AlertTriangle size={16} />
                        <span>Critical Breach: 0</span>
                    </div>
                    <div className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm">
                        <Clock size={16} />
                        <span>SLA Warning: 2</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-secondary">Loading Cockpit...</div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-4 h-full">
                    <KanbanColumn title="Backlog" status="OPEN" items={tickets.filter(t => t.status === 'OPEN')} />
                    <KanbanColumn title="In Progress" status="IN_PROGRESS" items={tickets.filter(t => t.status === 'IN_PROGRESS')} />
                    <KanbanColumn title="Resolved" status="RESOLVED" items={tickets.filter(t => t.status === 'RESOLVED')} />
                </div>
            )}
        </div>
    );
};

export default EngineerCockpit;
