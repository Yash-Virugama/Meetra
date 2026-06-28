import "../styles/Navbar.css";
import { useNavigate } from "react-router-dom";
import meetraLogo from "../assets/meetra-logo.png";
import { useState, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar() {

  const navigate = useNavigate();
  const { handleLogout } = useContext(AuthContext);

  const joinAsGuest = async () => {
    const roomCode = uuidv4().slice(0, 8);

    navigate(`/guest/${roomCode}`);

  };

  return (
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

        {localStorage.getItem("token") ? <button onClick={() => {
          navigate("/home");
        }}
          className="nav-link">
          Home
        </button> : <></>}

        {!localStorage.getItem("token") ? <button onClick={joinAsGuest}
          className="nav-link">
          Join as Guest
        </button> : <></>}

        {!(localStorage.getItem("token")) ? <button onClick={() => {
          navigate("/auth?mode=register");
        }}
          className="nav-link">
          Register
        </button> : <></>}

        {!(localStorage.getItem("token")) ?

          <button onClick={() => {
            navigate("/auth?mode=login");
          }}
            className="nav-button">
            Login
          </button> :

          <button onClick={handleLogout}
            className="nav-button">
            Log Out
          </button>}

      </div>
    </nav>

  )
}