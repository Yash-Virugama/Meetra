import { createContext, useCallback, useMemo, useState } from "react";
import Loader from "../components/Loader";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const showLoader = useCallback(() => {
        setLoading(true);
    }, []);

    const hideLoader = useCallback(() => {
        setLoading(false);
    }, []);

    const value = useMemo(
        () => ({ showLoader, hideLoader }),
        [showLoader, hideLoader]
    );

    return (
        <LoadingContext.Provider value={value}>
            {children}

            {loading && <Loader />}
        </LoadingContext.Provider>
    );
};