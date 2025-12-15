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

        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'NEW_TICKET') {
                    console.log('New ticket received:', msg.data);
                    setTickets(prev => [msg.data, ...prev]);
                    flashPulse();
                } else if (msg.type === 'TICKET_UPDATED') {
                    console.log('Ticket updated:', msg.data);
                    setTickets(prev => prev.map(t => t.id === msg.data.id ? msg.data : t));
                    flashPulse();
                }
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting in 3s...');
            setTimeout(setupWebSocket, 3000); // Simple reconnect
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
        <div className="flex-1 min-w-[320px] bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col h-full">
            <h3 className="font-bold mb-3 px-1 flex justify-between items-center text-slate-600 uppercase tracking-widest text-xs">
                {title}
                <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700">{items.length}</span>
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto">
                {items.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-lg shadow-saas-sm border border-slate-200 hover:border-brand-300 hover:shadow-saas-md transition-all group relative">
                        {/* Severity Tag */}
                        <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-lg 
                             ${t.severity === 'CRITICAL' ? 'bg-red-500' : t.severity === 'HIGH' ? 'bg-orange-500' : 'bg-blue-400'}`}>
                        </div>

                        <div className="flex justify-between items-start mb-2 pr-2">
                            <span className="font-mono text-[10px] text-slate-400">#{t.id.slice(0, 6)}</span>
                            <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <h4 className="font-semibold text-slate-800 mb-2 leading-tight pr-3">{t.title}</h4>

                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-50">
                            <div className="flex gap-1.5">
                                {status !== 'OPEN' && (
                                    <button onClick={() => updateStatus(t.id, 'OPEN')} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500" title="Move Back">←</button>
                                )}
                                {status !== 'IN_PROGRESS' && status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'IN_PROGRESS')} className="px-2 py-1 rounded bg-brand-50 text-brand-600 text-xs font-medium hover:bg-brand-100">Start</button>
                                )}
                                {status !== 'RESOLVED' && (
                                    <button onClick={() => updateStatus(t.id, 'RESOLVED')} className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100">Resolve</button>
                                )}
                            </div>
                            <button onClick={() => triggerExternalFetch(t.id)} className="text-slate-400 hover:text-brand-500 transition-colors" title="Diagnostics">
                                <Zap size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-slate-400 py-10 border border-dashed border-slate-200 rounded-lg">No tickets</div>}
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Engineer Cockpit
                        {pulse && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                    </h1>
                    <p className="text-sm text-slate-500">Real-time ticket monitoring and triage.</p>
                </div>

                <div className="flex gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-100 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> CRITICAL: 0
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 flex items-center gap-1.5">
                        <Clock size={12} /> BREACH RISK: 2
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse">Loading Board...</div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    <KanbanColumn title="Backlog" status="OPEN" items={tickets.filter(t => t.status === 'OPEN')} />
                    <KanbanColumn title="In Progress" status="IN_PROGRESS" items={tickets.filter(t => t.status === 'IN_PROGRESS')} />
                    <KanbanColumn title="Done" status="RESOLVED" items={tickets.filter(t => t.status === 'RESOLVED')} />
                </div>
            )}
        </div>
    );
};

export default EngineerCockpit;
