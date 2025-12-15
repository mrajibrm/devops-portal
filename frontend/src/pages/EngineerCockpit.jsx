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
        <div className="flex-1 min-w-[300px] bg-bg-secondary/50 rounded-lg p-4 border border-border">
            <h3 className="font-bold mb-4 flex justify-between">
                {title}
                <span className="bg-border text-xs px-2 py-1 rounded-full">{items.length}</span>
            </h3>
            <div className="space-y-3">
                {items.map(t => (
                    <div key={t.id} className="card p-3 hover:border-accent group transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`badge badge-${t.severity?.toLowerCase() || 'low'}`}>{t.severity}</span>
                            <div className="text-secondary text-xs font-mono">{new Date(t.created_at).toLocaleTimeString()}</div>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{t.title}</h4>
                        <p className="text-secondary text-xs line-clamp-2 mb-3">{t.description}</p>

                        <div className="flex justify-between items-center border-t border-border pt-2 mt-2">
                            <div className="flex gap-2">
                                {status !== 'OPEN' && (
                                    <button onClick={() => updateStatus(t.id, 'OPEN')} className="text-xs hover:text-accent" title="Move to Open">←</button>
                                )}
                                {status !== 'IN_PROGRESS' && status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'IN_PROGRESS')} className="text-xs hover:text-info" title="Start Work">Start</button>
                                )}
                                {status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'RESOLVED')} className="text-xs hover:text-success" title="Resolve">Resolve</button>
                                )}
                            </div>
                            <button onClick={() => triggerExternalFetch(t.id)} className="text-primary hover:text-info" title="External Fetch">
                                <Zap size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="text-center text-sm text-secondary/50 italic py-4">No tickets</div>}
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    Engineer Cockpit
                    {pulse && <span className="text-xs text-accent animate-pulse font-mono flex items-center gap-1"><RefreshCw size={12} /> UPDATING</span>}
                </h1>
                <div className="text-sm text-secondary flex gap-4">
                    <span className="flex items-center gap-1"><AlertTriangle size={14} className="text-danger" /> Critical Breach: 0</span>
                    <span className="flex items-center gap-1"><Clock size={14} className="text-warning" /> SLA Warning: 2</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-secondary">Loading Cockpit...</div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-4">
                    <KanbanColumn title="Backlog" status="OPEN" items={tickets.filter(t => t.status === 'OPEN')} />
                    <KanbanColumn title="In Progress" status="IN_PROGRESS" items={tickets.filter(t => t.status === 'IN_PROGRESS')} />
                    <KanbanColumn title="Resolved" status="RESOLVED" items={tickets.filter(t => t.status === 'RESOLVED')} />
                </div>
            )}
        </div>
    );
};

export default EngineerCockpit;
