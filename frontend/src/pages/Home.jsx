import "../styles/Home.css";
import withAuth from "../utils/WithAuth.jsx";
import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import meetraLogo from "../assets/meetra-logo.png";
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from "../contexts/AuthContext.jsx";
import { SnackbarContext } from "../contexts/SnackbarContext.jsx";
import { v4 as uuidv4 } from "uuid";
import { LoadingContext } from "../contexts/LoadingContext";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useContext(LoadingContext);
  const { addToUserHistory, endMeeting } = useContext(AuthContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const [meetingCode, setMeetingCode] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notice, setNotice] = useState("");
  const [joinMode, setJoinMode] = useState("0");

  useEffect(() => {
    hideLoader();
  }, [location.pathname, hideLoader]);

  const cleanCode = meetingCode.trim();

  useEffect(() => {
    const checkDanglingMeeting = async () => {
      const danglingMeetingId = localStorage.getItem("currentMeetingId");
      if (danglingMeetingId) {
        try {
          await endMeeting(danglingMeetingId);
        } catch (err) {
          console.error("Failed to end dangling meeting on mount:", err);
        } finally {
          localStorage.removeItem("currentMeetingId");
        }
      }
    };
    checkDanglingMeeting();
  }, [endMeeting]);

  const handleJoinVideoCall = (event) => {
    event.preventDefault();

    if (joinMode === "0") {
      if (!cleanCode) {
        setNotice("Meeting code is required");
        return;
      }
      if (cleanCode.length < 3) {
        setNotice("Meeting code must be at least 3 characters");
        return;
      }
      if (cleanCode.length > 25) {
        setNotice("Meeting code cannot exceed 25 characters");
        return;
      }
    }

    navigate(`/meeting/${cleanCode}`);
  };

  const handleCreateMeeting = () => {
    const roomCode =
      `meetra-${uuidv4().slice(0, 8)}`;

    navigate(`/meeting/${roomCode}`);
  };

  const handleLogout = async () => {
    const danglingMeetingId = localStorage.getItem("currentMeetingId");
    showLoader();
    if (danglingMeetingId) {
      try {
        await endMeeting(danglingMeetingId);
      } catch (err) {
        console.error("Failed to end dangling meeting on logout:", err);
      } finally {
        localStorage.removeItem("currentMeetingId");
      }
    }
    localStorage.removeItem("token");
    hideLoader();
    showSnackbar("User logged out successfully!", "success");
    navigate("/auth?mode=login");
  };

  const joinViaCode = () => {
    setJoinMode("0");
  }

  const joinViaLink = () => {
    setJoinMode("1");
  }

  const handleJoinViaLink = () => {
    try {
      const trimmedLink = meetingLink.trim();
      if (!trimmedLink) {
        setNotice("Meeting link is required");
        return;
      }

      const newUrl = new URL(trimmedLink).pathname.slice(1).trim();

      if (!newUrl) {
        setNotice("Please enter a valid meeting link");
        return;
      }

      if (newUrl.length < 3) {
        setNotice("Meeting code in the link must be at least 3 characters");
        return;
      }
      if (newUrl.length > 25) {
        setNotice("Meeting code in the link cannot exceed 25 characters");
        return;
      }

      navigate(`/${newUrl}`);
    } catch (error) {
      setNotice("Please enter a valid meeting link");
    }
  };

  useEffect(() => {
    if (location.state?.snackbar) {
      showSnackbar(location.state.snackbar.message, location.state.snackbar.severity);

      // Clear state so snackbar doesn't show again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, showSnackbar]);

  return (
    <main className="home-page">
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

          {/* <a onClick={handleCreateMeeting}
            className="nav-link">
            Start meeting
          </a> */}

          <a onClick={() => {
            navigate("/history");
          }}
            className="nav-link"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <RestoreIcon />History
          </a>

          <a onClick={handleLogout}
            className="nav-button">
            Log Out
          </a>

        </div>
      </nav>

      <section className="home-studio" aria-labelledby="home-title">
        <div className="studio-heading">
          <p className="studio-badge">Meetra room pass</p>
          <h1 id="home-title">Ready to join your call? <span className="title-dash">-</span>
            <button type="button" className="start-meeting" onClick={handleCreateMeeting}>
              Start Meeting
            </button>
          </h1>
          <p className="studio-sub">No waiting rooms. No awkward hellos. Just connect.</p>
        </div>

        <div className="studio-board">
          <div className="shape shape-aqua lobby-shape-aqua home-shape-aqua" aria-hidden="true">
            <span className="bubble bubble-yeah">yeay!</span>
            <span className="eye eye-aqua" />
            <span className="mouth mouth-smile aqua-smile" />
          </div>
          <div className="status-rail" aria-label="Meeting status">
            <span className="rail-tag">Ready</span>
            <div className="rail-step active">
              <span className="step-number">01</span>
              <span className="step-label">Camera</span>
            </div>
            <div className="rail-step">
              <span className="step-number">02</span>
              <span className="step-label">Code</span>
            </div>
            <div className="rail-step">
              <span className="step-number">03</span>
              <span className="step-label">Room</span>
            </div>
          </div>

          <form className="join-pass" onSubmit={handleJoinVideoCall}>
            <div className="pass-main">
              <div className="pass-header">
                <p>Get started</p>
                <h2>Create / Join a video call</h2>
              </div>

              {joinMode === "0" ?
                <label className="meeting-field">
                  <span className="field-label">Meeting Code</span>
                  <div className="meeting-input-wrap">
                    <input
                      type="text"
                      value={meetingCode}
                      onChange={(event) => {
                        setMeetingCode(event.target.value);
                        setNotice("");
                      }}
                      placeholder="Enter your code"
                      aria-label="Meeting code"
                    />
                    <svg
                      className="key-icon"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="7.5" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M11 12.5h9M16 12.5v-3M19 12.5v-2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <button className="join" type="submit">
                      Join
                    </button>
                  </div>
                </label> : <label className="meeting-field">
                  <span className="field-label">Meeting Link</span>
                  <div className="meeting-input-wrap">
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(event) => {
                        setMeetingLink(event.target.value);
                        setNotice("");
                      }}
                      placeholder="Enter your link"
                      aria-label="Meeting link"
                    />
                    <svg
                      className="key-icon"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="7.5" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M11 12.5h9M16 12.5v-3M19 12.5v-2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <button type="button" className="join" onClick={handleJoinViaLink}>
                      Join
                    </button>
                  </div>
                </label>}

              <div className="pass-actions">
                <button type="button" className="join-via-code" onClick={joinViaCode}>
                  <span className="btn-icon" aria-hidden="true" />
                  Join meeting via code
                </button>

                <button type="button" className="join-via-link" onClick={joinViaLink}>
                  <span className="mini-camera" aria-hidden="true" />
                  Join meeting via link
                </button>

                {/* <button type="button" className="create-submit" onClick={handleCreateMeeting}>
                  <span className="mini-camera" aria-hidden="true" />
                  Create meeting
                </button> */}


              </div>

              <p className={notice ? "home-notice visible" : "home-notice"}>
                {notice || "Use a code or make a fresh room - your call."}
              </p>
            </div>

            <div className="pass-cut" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <aside className="pass-side" aria-label="Call details">
              <span className="live-chip">Live</span>
              <div className="room-code-preview">
                <span>Room</span>
                <strong>{cleanCode || "MEETRA"}</strong>
              </div>
              <div className="mini-screen">
                <span className="screen-dot" />
                <span className="screen-dot" />
                <span className="screen-dot" />
                <div className="screen-face">
                  <span className="face-eye left" />
                  <span className="face-eye right" />
                  <span className="face-smile" />
                </div>
              </div>
            </aside>
          </form>

          <div className="room-orbit">
            <span className="orbit-ring" />

            <div className="orbit-path orbit-path-1">
              <span className="orbit-node node-one" />
            </div>

            <div className="orbit-path orbit-path-2">
              <span className="orbit-node node-two" />
            </div>

            <div className="orbit-card">
              <img src={meetraLogo} alt="" className="orbit-logo" />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default withAuth(Home);
