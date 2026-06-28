import "../styles/Error.css";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function ErrorPage() {
    const location = useLocation();

    // Parse query parameters from search URL (if redirected from interceptor/external url)
    const queryParams = new URLSearchParams(location.search);
    const queryMessage = queryParams.get("message");
    const queryStatus = queryParams.get("status");

    // Extract dynamic error details or fallback to default 404
    const errorTitle = location.state?.title || queryStatus || "404";
    const errorSubtitle = location.state?.subtitle || (queryMessage ? "Application Error" : "Page Not Found");
    const errorDescription = location.state?.message || queryMessage || "The page you're looking for doesn't exist.";

    return (
        <div className="error-page">
            <Navbar />
            
            <div className="error-content">
                <div className="error-illustration" aria-hidden="true">
                    <div className="error-shape">
                        <div className="error-face">
                            <span className="error-eye left" />
                            <span className="error-eye right" />
                            <span className="error-mouth" />
                        </div>
                    </div>
                </div>

                <h1 className="error-title">{errorTitle}</h1>
                <h2 className="error-subtitle">{errorSubtitle}</h2>
                <p className="error-description">{errorDescription}</p>

                <Link to="/" className="error-btn">
                    Go Back
                </Link>
            </div>
        </div>
    );
}
