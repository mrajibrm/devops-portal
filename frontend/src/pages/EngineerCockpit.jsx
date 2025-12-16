import React, { useState, useEffect } from 'react';
import { useTickets } from '../context/TicketContext';
import { RefreshCw, Clock, Zap, AlertTriangle, CheckCircle, MoreHorizontal, X, User, Activity } from 'lucide-react';

const EngineerCockpit = () => {
    const { tickets, loading, lastEvent, updateTicketStatus, fetchExternalData, getTicketHistory } = useTickets();
    const [pulse, setPulse] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (lastEvent) {
            setPulse(true);
            const timer = setTimeout(() => setPulse(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [lastEvent]);

    useEffect(() => {
        if (selectedTicket) {
            fetchHistory(selectedTicket.id);
        }
    }, [selectedTicket, lastEvent]);

    const fetchHistory = async (id) => {
        setHistoryLoading(true);
        try {
            const data = await getTicketHistory(id);
            setHistory(data || []);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await updateTicketStatus(id, newStatus);
        } catch (err) { alert('Update failed'); }
    };

    const triggerExternalFetch = async (id) => {
        const url = prompt("Enter External URL to fetch diagnostic data (e.g., http://safe-internal-metrics):");
        if (!url) return;
        try {
            const res = await fetchExternalData(id, url);
            alert(`Success: ${res.data}`);
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
                    <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="bg-white p-4 rounded-lg shadow-saas-sm border border-slate-200 hover:border-brand-300 hover:shadow-saas-md transition-all group relative cursor-pointer"
                    >
                        {/* Severity Tag */}
                        <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-lg 
                             ${t.severity === 'CRITICAL' ? 'bg-red-500' : t.severity === 'HIGH' ? 'bg-orange-500' : 'bg-blue-400'}`}>
                        </div>

                        <div className="flex justify-between items-start mb-2 pr-2">
                            <span className="font-mono text-[10px] text-slate-400">#{t.id.slice(0, 6)}</span>
                            <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <h4 className="font-semibold text-slate-800 mb-1 leading-tight pr-3 truncate">{t.title}</h4>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <User size={10} /> {t.owner_id}
                        </div>

                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-50" onClick={e => e.stopPropagation()}>
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
        <div className="h-[calc(100vh-6rem)] flex flex-col relative">
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
                        <AlertTriangle size={12} /> CRITICAL: {tickets.filter(t => t.severity === 'CRITICAL').length}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 flex items-center gap-1.5">
                        <Clock size={12} /> PENDING: {tickets.filter(t => t.status === 'OPEN').length}
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

            {/* Ticket Details Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-0 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                        ${selectedTicket.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                        {selectedTicket.severity}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">#{selectedTicket.id}</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedTicket.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><User size={14} /> {selectedTicket.owner_id}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                            {/* Description */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                    {selectedTicket.description}
                                </div>
                            </section>

                            {/* Activity Trail */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Argument Trail
                                </h3>

                                {historyLoading ? (
                                    <div className="text-center py-4 text-slate-400">Loading history...</div>
                                ) : (
                                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                                        {history.map((event, idx) => (
                                            <div key={event.id || idx} className="relative">
                                                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100"></div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700">{event.event_type}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(event.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                        {event.details}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        by <span className="font-medium text-slate-500">{event.actor_id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {history.length === 0 && <div className="text-xs text-slate-400 italic">No history available.</div>}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 z-10">
                            <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Close</button>
                            {selectedTicket.status !== 'RESOLVED' && (
                                <button onClick={() => { updateStatus(selectedTicket.id, 'RESOLVED'); setSelectedTicket(null); }} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                                    Resolve Ticket
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EngineerCockpit;
