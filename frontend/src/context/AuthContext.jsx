import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import SessionTimeoutModal from '../components/SessionTimeoutModal';

const AuthContext = createContext();

// Constants
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const WARNING_TIMEOUT_MS = 14 * 60 * 1000; // 14 Minutes (Show warning 1 min before)
const API_URL = import.meta.env.VITE_API_URL || '/api'; // Use env or proxy

// Configure Axios Defaults globally
axios.defaults.withCredentials = true; // IMPORTANT for HttpOnly Cookies

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null); // Access Token Only

    // Idle State
    const [isIdle, setIsIdle] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Seconds remaining after warning

    const idleTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    // --- Axios Interceptor ---
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                // If 401 and we haven't retried yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        // Attempt refresh (cookie is sent automatically)
                        const res = await axios.post(`${API_URL}/auth/refresh`);
                        const { accessToken } = res.data;

                        // Update state
                        setToken(accessToken);
                        localStorage.setItem('token', accessToken);

                        // Update header and retry
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        console.error("Session expired or refresh failed", refreshError);
                        logout(); // Force logout
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Add Authorization header to all requests if token exists
        const reqInterceptor = axios.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
            axios.interceptors.request.eject(reqInterceptor);
        };
    }, [token]);

    // --- Idle Timer Logic ---
    const resetTimer = useCallback(() => {
        if (!user) return;

        // Clear existing timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        setShowTimeoutModal(false);
        setTimeLeft(60);

        // Set Warning Timer
        warningTimerRef.current = setTimeout(() => {
            setShowTimeoutModal(true);

            // Start Countdown
            countdownIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current);
                        logout(); // Time's up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        }, WARNING_TIMEOUT_MS);

        // Set Hard Idle Timer (Backup if countdown logic fails or tab is backgrounded strangely)
        idleTimerRef.current = setTimeout(() => {
            logout();
        }, IDLE_TIMEOUT_MS);

    }, [user]);

    // Attach Event Listeners
    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => {
            // Only reset if modal is NOT showing. If modal is showing, user must interact with it explicitly.
            if (!showTimeoutModal) {
                resetTimer();
            }
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        resetTimer(); // Start timer on mount/login

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [user, showTimeoutModal, resetTimer]);


    // --- Auth Actions ---
    const login = async (username, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            const { accessToken, role } = res.data;

            const userData = { username, role };
            setUser(userData);
            setToken(accessToken);

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));

            // Refresh token is now in Cookie, nothing to store for it
            return true;
        } catch (err) {
            console.error("Login failed", err);
            return false;
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`); // Clear cookie on backend
        } catch (e) {
            // Ignore error
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setShowTimeoutModal(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };

    const keepSession = async () => {
        // Ping server to ensure cookie is still valid/extend session if needed
        try {
            await axios.post(`${API_URL}/auth/refresh`);
            resetTimer();
        } catch (e) {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
            {user && (
                <SessionTimeoutModal
                    open={showTimeoutModal}
                    onLogout={logout}
                    onKeepSession={keepSession}
                    timeLeft={timeLeft}
                />
            )}
        </AuthContext.Provider>
    );
};
