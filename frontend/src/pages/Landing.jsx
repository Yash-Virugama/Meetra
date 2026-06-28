import "../styles/Landing.css";
import { useLocation, useNavigate } from "react-router-dom";
import HeroArt from "../components/HeroArt";
import Navbar from "../components/Navbar.jsx";
import { useEffect, useState, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { SnackbarContext } from "../contexts/SnackbarContext.jsx";
import { LoadingContext } from "../contexts/LoadingContext";

export default function Landing() {

  const location = useLocation();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useContext(LoadingContext);
  const { showSnackbar } = useContext(SnackbarContext);

  useEffect(() => {
    hideLoader();
  }, [location.pathname, hideLoader]);

  const handleCreateMeeting = () => {
    // showLoader();

    if (localStorage.getItem("token")) {
      navigate("/home");
    } else {
      showSnackbar("Please login to create a meeting", "warning");
      navigate("/auth?mode=login");
    }
  };

  const joinAsGuest = async () => {
    // showLoader();
    const roomCode = uuidv4().slice(0, 8);

    navigate(`/guest/${roomCode}`);

  };

  useEffect(() => {
    if (location.state?.snackbar) {
      showSnackbar(location.state.snackbar.message, location.state.snackbar.severity);

      // Clear state so snackbar doesn't show again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, showSnackbar]);

  return (

    <main className="landing-page">

      <Navbar />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Fast, reliable,
            <br />
            and <span className="secure-word">secure</span> conferencing
          </h1>
          <p>
            Hold incredible events, share knowledge, build and grow your
            community, create opportunity
          </p>

          <div className="hero-actions">
            <a onClick={handleCreateMeeting}
              className="meeting-button">
              <span className="camera-icon" aria-hidden="true" />
              Create / Join meeting
            </a>

            {!localStorage.getItem("token") ? <a onClick={joinAsGuest}
              className="watch-link" aria-label="Join as Guest">
              <span className="play-button" aria-hidden="true" />
              Join as Guest
            </a> : <></>}
          </div>
        </div>

        <div className="hero-art-container">
          <HeroArt />
        </div>
      </section>
    </main>
  );
}
