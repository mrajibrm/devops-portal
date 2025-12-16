import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TicketContext = createContext();

export const useTickets = () => useContext(TicketContext);

export const TicketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastEvent, setLastEvent] = useState(null); // Useful for UI flash effects
    const wsRef = useRef(null);

    // Fetch initial state
    useEffect(() => {
        if (!token) {
            setTickets([]);
            setLoading(false);
            return;
        }

        const fetchTickets = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/tickets', { headers: { Authorization: `Bearer ${token}` } });
                setTickets(res.data || []);
            } catch (err) {
                console.error("Failed to fetch tickets", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [token]);

    // WebSocket Connection
    useEffect(() => {
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/tickets/live?token=${token}`;

        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => console.log('WebSocket Connected');

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleMessage(msg);
            } catch (e) {
                console.error('WebSocket message error:', e);
            }
        };

        ws.onclose = () => console.log('WebSocket Disconnected');
        ws.onerror = (err) => console.error('WebSocket Error:', err);

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [token]);

    const handleMessage = (msg) => {
        setLastEvent(Date.now());
        if (msg.type === 'NEW_TICKET') {
            setTickets(prev => {
                // Prevent duplicate if we already added it optimistically or via previous WS message
                if (prev.some(t => t.id === msg.data.id)) return prev;
                return [msg.data, ...prev];
            });
        } else if (msg.type === 'TICKET_UPDATED') {
            setTickets(prev => prev.map(t => t.id === msg.data.id ? msg.data : t));
        }
    };

    // Actions
    const createTicket = async (payload) => {
        const res = await axios.post('/api/tickets', payload, { headers: { Authorization: `Bearer ${token}` } });
        const newTicket = res.data;
        // Immediate local update
        setTickets(prev => {
            if (prev.some(t => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
        });
        return newTicket;
    };

    const updateTicketStatus = async (id, status) => {
        const res = await axios.patch(`/api/tickets/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
        const updatedTicket = res.data;
        // Immediate local update
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    };

    const fetchExternalData = async (id, url) => {
        const res = await axios.post(`/api/tickets/${id}/fetch`, { url }, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    };

    const value = {
        tickets,
        loading,
        lastEvent,
        createTicket,
        updateTicketStatus,
        fetchExternalData
    };

    return (
        <TicketContext.Provider value={value}>
            {children}
        </TicketContext.Provider>
    );
};
