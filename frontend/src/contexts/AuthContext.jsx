import { createContext, useState, useContext, useCallback } from "react";
import axios from "axios";
import httpStatus from "http-status";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "./SnackbarContext.jsx";
import { LoadingContext } from "./LoadingContext.jsx";
import { API_URL } from "../config/config.js";

export const AuthContext = createContext();

const client = axios.create({
    baseURL: `${API_URL}/users`,
});

// Request interceptor to attach bearer token to all requests
client.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally (e.g., 401 Unauthorized, general API errors)
client.interceptors.response.use((response) => response, (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            if (!window.location.pathname.startsWith("/auth")) {
                window.location.href = "/auth?mode=login";
            }
            return Promise.reject(error);
        }

        // Determine if this is a login or registration attempt
        const isAuthRequest = error.config?.url?.includes("/login") || error.config?.url?.includes("/register");
        if (!isAuthRequest) {
            const errorMessage = error.response?.data?.message || error.message || "Something went wrong!";
            const errorStatus = error.response?.status || "Error";
            window.location.href = `/error?message=${encodeURIComponent(errorMessage)}&status=${encodeURIComponent(errorStatus)}`;
        }

        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {

    const [userData, setUserData] = useState(null);
    
    const navigate = useNavigate();
    const { showSnackbar } = useContext(SnackbarContext);
    const { showLoader, hideLoader } = useContext(LoadingContext);

    const handleRegister = async (name, username, password) => {
        try {
            showLoader();
            const response = await client.post("/register", {
                name,
                username,
                password
            });

            if (response.status === 201) {
                const loginResponse = await client.post("/login", {
                    username,
                    password
                });

                if (loginResponse.status === 200) {
                    localStorage.setItem("token", loginResponse.data.token);
                    setUserData(loginResponse.data);
                    showSnackbar("Registration successful! Welcome!", "success");
                    navigate("/home");
                }
                return response.data.message;
            }

        } catch (err) {
            console.error("Register Error:", err);
            throw err;
        } finally {
            hideLoader();
        }
    };

    const handleLogin = async (username, password) => {
        try {
            showLoader();
            const response = await client.post("/login", {
                username,
                password
            });

            if (response.status === 200) {

                localStorage.setItem(
                    "token",
                    response.data.token
                );

                console.log(localStorage.getItem("token"));

                setUserData(response.data);

                showSnackbar("User logged in successfully!", "success");
                navigate("/home");

                return response.data;
            }

        } catch (err) {
            console.error("Login Error:", err);
            throw err;
        } finally {
            hideLoader();
        }
    };

    const getHistoryOfUser = useCallback(async () => {
        try {
            const request = await client.get("/get_all_activity");
            return request.data;
        } catch (err) {
            throw err;
        }
    }, []);

    const addToUserHistory = useCallback(async (meetingCode) => {
        try {
            const request = await client.post("/add_to_activity", {
                meetingCode
            });

            return request.data;
        } catch (err) {
            console.error("Error adding to history:", err);
            throw err;
        }
    }, []);


    const endMeeting = useCallback(async (meetingId) => {
        try {
            if (!meetingId) {
                throw new Error("No meeting ID provided");
            }

            const response = await client.post("/end_meeting", {
                meetingId
            });
            return response.data;
        } catch (err) {
            console.error("Error ending meeting:", err);
            throw err;
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");

        setUserData(null);

        showSnackbar("User logged out successfully!", "success");
        navigate("/auth?mode=login");
    };

    const value = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory,
        endMeeting,
        handleLogout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};