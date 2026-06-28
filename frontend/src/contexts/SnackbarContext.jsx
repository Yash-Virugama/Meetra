import { createContext, useState, useCallback, useMemo } from "react";
import CustomSnackbar from "../components/Snackbar.jsx";


export const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    const showSnackbar = useCallback((message, severity = "info") => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    }, []);

    const closeSnackbar = useCallback(() => {
        setSnackbar((prev) => ({
            ...prev,
            open: false,
        }));
    }, []);

    const contextValue = useMemo(() => ({ showSnackbar }), [showSnackbar]);

    return (
        <SnackbarContext.Provider value={contextValue}>
            {children}

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={closeSnackbar}
            />
        </SnackbarContext.Provider>
    );
};