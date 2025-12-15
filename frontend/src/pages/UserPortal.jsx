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
            IN_PROGRESS: '
