import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/auth?mode=login" replace state={{
            snackbar: {
                message: "Please login to create a meeting.",
                severity: "warning",
            },
        }}/>;
    }

    return children;
}