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

        {localStorage.getItem("token") ? <a onClick={() => {
          navigate("/home");
        }}
          className="nav-link">
          Home
        </a> : <></>}

        {!localStorage.getItem("token") ? <a onClick={joinAsGuest}
          className="nav-link">
          Join as Guest
        </a> : <></>}

        {!(localStorage.getItem("token")) ? <a onClick={() => {
          navigate("/auth?mode=register");
        }}
          className="nav-link">
          Register
        </a> : <></>}

        {!(localStorage.getItem("token")) ?

          <a onClick={() => {
            navigate("/auth?mode=login");
          }}
            className="nav-button">
            Login
          </a> :

          <a onClick={handleLogout}
            className="nav-button">
            Log Out
          </a>}

      </div>
    </nav>

  )
}