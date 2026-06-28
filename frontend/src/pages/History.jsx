import "../styles/History.css";
import { useContext, useEffect, useState } from "react"
import { AuthContext } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { LoadingContext } from "../contexts/LoadingContext.jsx";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestoreIcon from '@mui/icons-material/Restore';
import meetraLogo from "../assets/meetra-logo.png";
import withAuth from "../utils/WithAuth";


function History() {

    const { getHistoryOfUser, handleLogout } = useContext(AuthContext);
    const { showLoader, hideLoader } = useContext(LoadingContext);

    const [meetings, setMeetings] = useState([]);
    const [visibleCount, setVisibleCount] = useState(6);
    // const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!localStorage.getItem("token")) return;
            try {
                showLoader();
                const history = await getHistoryOfUser();
                setMeetings(Array.isArray(history) ? history : []);
            } catch (err) {
                console.error("Error fetching history:", err);
                // If unauthorized, redirect to login
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/auth?mode=login");
                }
            } finally {
                // setLoading(false);
                hideLoader();
            }
        };

        fetchHistory();
    }, [getHistoryOfUser, navigate, showLoader, hideLoader]);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    const formatTime = (dateString) => {
        if (!dateString) return "--";

        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return "--";

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}m ${secs}s`;
    };

    return (
        <div className="history-page">

            {/* Top Navbar */}
            <nav className="navbar">
                <a onClick={() => {
                    navigate("/")
                }}
                    className="brand"
                    aria-label="Meetra home">
                    <img src={meetraLogo} alt="" className="brand-logo" />
                    <span>Meetra</span>
                </a>

                <div className="nav-actions" aria-label="Main navigation">

                    <button onClick={() => {
                        navigate("/home");
                    }}
                        className="nav-link">
                        Home
                    </button>

                    <button onClick={handleLogout}
                        className="nav-button">
                        Log Out
                    </button>

                </div>
            </nav>

            {/* Title Section with Back Button */}
            <div className="history-title-section">
                <IconButton
                    className="history-back-btn"
                    onClick={() => navigate("/home")}
                >
                    <ArrowBackIcon />
                </IconButton>
                <h1>Meeting History</h1>
            </div>

            { meetings.length !== 0 ? (
                <>
                    <div className="history-grid">
                        {meetings.slice(0, visibleCount).map((e, i) => (
                            <Card
                                key={i}
                                className="history-card"
                                variant="outlined"
                            >
                                <CardContent>
                                    <Typography className="meeting-code">
                                        Meeting Code: <span className="meeting-code-val">{e.meetingCode}</span>
                                    </Typography>

                                    <Typography className="meeting-info">
                                        <CalendarMonthIcon fontSize="small" /> Date: {formatDate(e.date)}
                                    </Typography>

                                    <Typography className="meeting-info">
                                        🟢 Joined: {formatTime(e.joinedAt)}
                                    </Typography>

                                    <Typography className="meeting-info">
                                        🔴 Left: {formatTime(e.leftAt)}
                                    </Typography>

                                    <Typography className="meeting-duration">
                                        <AccessTimeIcon fontSize="small" /> Duration: {formatDuration(e.duration)}
                                    </Typography>

                                    {/* Card Ghost overlay */}
                                    <div className="card-ghost" aria-hidden="true">
                                        <div className="card-bubble">
                                            {e.duration > 1800 ? "So long!" : "Cool!"}
                                        </div>
                                        <div className="ghost-body">
                                            <span className="ghost-eye left" />
                                            <span className="ghost-eye right" />
                                            <span className="ghost-mouth" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {visibleCount < meetings.length && (
                        <Button
                            className="history-load-more-btn"
                            onClick={() => setVisibleCount(prev => prev + 6)}
                        >
                            Load More
                        </Button>
                    )}
                    {/* Left side decorative doodle */}
                    <div className="history-doodle-left" aria-hidden="true">
                        <span className="bubble-organized">So organized!</span>
                        <div className="doodle-ghost-teal">
                            <span className="eye eye-left" />
                            <span className="eye eye-right" />
                            <span className="mouth mouth-smile" />
                        </div>
                    </div>

                    {/* Right side decorative doodle grid */}
                    <div className="history-doodle-right" aria-hidden="true">
                        <span className="bubble-past-calls">Wow, so many past calls!</span>
                        <div className="doodle-grid-mini">
                            <div className="mini-shape shape-orange">
                                <span className="eye eye-left" />
                                <span className="mouth mouth-flat" />
                            </div>
                            <div className="mini-shape shape-purple">
                                <span className="mouth mouth-smile" />
                            </div>
                            <div className="mini-shape shape-yellow">
                                <span className="eye eye-right" />
                                <span className="mouth mouth-beak" />
                            </div>
                            <div className="mini-shape shape-pink">
                                <span className="eye eye-pink-left" />
                                <span className="eye eye-pink-right" />
                                <span className="split-line" />
                            </div>
                            <div className="mini-shape shape-aqua">
                                <span className="eye eye-aqua" />
                                <span className="mouth mouth-smile aqua-smile" />
                            </div>
                        </div>
                    </div>

                </>
            ) : (<>
                <div className="empty-history">
                    <h2>No History Available</h2>
                    <p>Your joined meetings will appear here.</p>
                </div>

                <div className="history-doodle-left empty-doodle-left" aria-hidden="true">
                    <span className="bubble-organized">Use Meetra!</span>
                    <div className="doodle-ghost-teal">
                        <span className="eye eye-left" />
                        <span className="eye eye-right" />
                        <span className="mouth mouth-smile" />
                    </div>
                </div>


                <div className="history-doodle-right empty-doodle-right" aria-hidden="true">
                    <span className="bubble-past-calls">Ohh, no past calls!</span>
                    <div className="doodle-grid-mini">
                        <div className="mini-shape shape-orange">
                            <span className="eye eye-left" />
                            <span className="mouth mouth-flat" />
                        </div>
                        <div className="mini-shape shape-purple">
                            <span className="mouth mouth-smile" />
                        </div>
                        <div className="mini-shape shape-yellow">
                            <span className="eye eye-right" />
                            <span className="mouth mouth-beak" />
                        </div>
                        <div className="mini-shape shape-pink">
                            <span className="eye eye-pink-left" />
                            <span className="eye eye-pink-right" />
                            <span className="split-line" />
                        </div>
                        <div className="mini-shape shape-aqua">
                            <span className="eye eye-aqua" />
                            <span className="mouth mouth-smile aqua-smile" />
                        </div>
                    </div>
                </div>
            </>

            )}

        </div>
    );
}

export default withAuth(History);

