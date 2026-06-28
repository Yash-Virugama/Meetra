import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SnackbarContext } from "../contexts/SnackbarContext.jsx";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const navigate = useNavigate();
        const { showSnackbar } = useContext(SnackbarContext);


        const isAuthenticated = () => {
            if (localStorage.getItem("token")) {
                return true;
            }
            return false;
        }

        useEffect(() => {
            if (!isAuthenticated()) {
                showSnackbar("Please login to access this page", "warning");
                navigate("/auth?mode=login");
            }
        }, [navigate, showSnackbar]);

        if (!isAuthenticated()) {
            return null;
        }

        return <WrappedComponent {...props} />;
    }

    return AuthComponent;
}

export default withAuth;
