import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const login = async (username, password) => {
        try {
            // In dev, using relative path assuming proxy. In prod, env var.
            const res = await axios.post('/api/auth/login', { username, password });
            const { accessToken, role } = res.data;

            const userData = { username, role };
            setUser(userData);
            setToken(accessToken);

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));

            return true;
        } catch (err) {
            console.error("Login failed", err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
