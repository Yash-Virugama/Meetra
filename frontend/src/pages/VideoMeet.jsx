import "../styles/VideoMeet.css";
import { useEffect, useRef, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from "@mui/material/Badge";
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from "../contexts/AuthContext.jsx";
import meetraLogo from "../assets/meetra-logo.png";
import { SnackbarContext } from "../contexts/SnackbarContext.jsx";
import { LoadingContext } from "../contexts/LoadingContext.jsx";
import { SOCKET_URL } from "../config/config.js";


const serverUrl = SOCKET_URL;

let connections = {};
let peerConnectionInitiators = new Set();
let iceCandidatesQueue = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeet() {
    const location = useLocation();
    const navigate = useNavigate();
    const socketRef = useRef();
    const socketIdRef = useRef();

    const localVideoRef = useRef();


    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(true);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const showChatRef = useRef(showChat);
    useEffect(() => {
        showChatRef.current = showChat;
    }, [showChat]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [videos, setVideos] = useState([]);
    const videoRef = useRef([]);
    const { endMeeting, addToUserHistory } = useContext(AuthContext);
    const { showSnackbar } = useContext(SnackbarContext);
    const { showLoader, hideLoader } = useContext(LoadingContext);

    useEffect(() => {
        hideLoader();
    }, [location.pathname, hideLoader]);

    // for snackbar

    useEffect(() => {
        if (location.state?.snackbar) {
            showSnackbar(location.state.snackbar.message, location.state.snackbar.severity);

            // Clear state so snackbar doesn't show again on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, showSnackbar]);

    useEffect(() => {
        const roomCode = window.location.pathname.split("/").pop();
        // console.log(roomCode);
        if (roomCode.length < 3 || roomCode.length > 25) {
            showSnackbar("Length of meeting code must be less greater than 3 and less than 25", "error");
            if (localStorage.getItem("token")) {
                navigate("/home");
            } else {
                navigate("/");
            }
        }
    }, [navigate]);

    // Store mapping of socketId to username for all users
    const userMapRef = useRef(new Map());

    // ---------- Helper: black video track ----------
    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return stream.getVideoTracks()[0];
    };

    // ---------- Helper: silent audio track (no beep) ----------
    const silence = () => {
        const ctx = new AudioContext();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        const oscillator = ctx.createOscillator();
        oscillator.connect(gainNode);
        const dst = gainNode.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return dst.stream.getAudioTracks()[0];
    };

    // ---------- Get initial permissions ----------
    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) setVideoAvailable(true);
            else setVideoAvailable(false);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) setAudioAvailable(true);
            else setAudioAvailable(false);

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });
                if (stream) {
                    window.localStream = stream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getPermissions();

        const terminateMeeting = () => {
            const meetingId = localStorage.getItem("currentMeetingId");
            const token = localStorage.getItem("token");
            if (!meetingId) return;

            localStorage.removeItem("currentMeetingId");

            const headers = {
                "Content-Type": "application/json"
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            fetch(`${serverUrl}/api/v1/users/end_meeting`, {
                method: "POST",
                headers,
                body: JSON.stringify({ meetingId }),
                keepalive: true
            }).catch(err => console.error("Error ending meeting on unload:", err));
        };

        window.addEventListener("beforeunload", terminateMeeting);
        window.addEventListener("pagehide", terminateMeeting);

        return () => {
            terminateMeeting();
            window.removeEventListener("beforeunload", terminateMeeting);
            window.removeEventListener("pagehide", terminateMeeting);

            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
            for (const id in connections) {
                connections[id].close();
                delete connections[id];
            }
            iceCandidatesQueue = {};
            peerConnectionInitiators.clear();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (!askForUsername && localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername, video, audio]);

    // ---------- Replace video track ----------
    const replaceVideoTrack = (newTrack) => {
        if (!window.localStream) return;
        const oldVideoTrack = window.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
            window.localStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
        }
        window.localStream.addTrack(newTrack);
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
        }
        for (const id in connections) {
            if (id === socketIdRef.current) continue;
            try {
                const senders = connections[id].getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(newTrack);
                }
            } catch (e) { console.log(e); }
        }
    };

    // ---------- Replace audio track ----------
    const replaceAudioTrack = (newTrack) => {
        if (!window.localStream) return;
        const oldAudioTrack = window.localStream.getAudioTracks()[0];
        if (oldAudioTrack) {
            window.localStream.removeTrack(oldAudioTrack);
            oldAudioTrack.stop();
        }
        window.localStream.addTrack(newTrack);
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
        }
        for (const id in connections) {
            if (id === socketIdRef.current) continue;
            try {
                const senders = connections[id].getSenders();
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                if (audioSender) {
                    audioSender.replaceTrack(newTrack);
                }
            } catch (e) { console.log(e); }
        }
    };

    // ---------- Toggle video ----------
    const toggleVideo = async () => {
        if (video) {
            const blackTrack = black();
            replaceVideoTrack(blackTrack);
            setVideo(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                const videoTrack = stream.getVideoTracks()[0];
                videoTrack.onended = () => {
                    setVideo(false);
                    const blackTrack = black();
                    replaceVideoTrack(blackTrack);
                };
                replaceVideoTrack(videoTrack);
                setVideo(true);
            } catch (e) {
                console.log("Could not access camera", e);
                const blackTrack = black();
                replaceVideoTrack(blackTrack);
                setVideo(false);
            }
        }
    };

    // ---------- Toggle audio ----------
    const toggleAudio = async () => {
        if (audio) {
            const silenceTrack = silence();
            replaceAudioTrack(silenceTrack);
            setAudio(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                const audioTrack = stream.getAudioTracks()[0];
                audioTrack.onended = () => {
                    setAudio(false);
                    const silenceTrack = silence();
                    replaceAudioTrack(silenceTrack);
                };
                replaceAudioTrack(audioTrack);
                setAudio(true);
            } catch (e) {
                console.log("Could not access microphone", e);
                const silenceTrack = silence();
                replaceAudioTrack(silenceTrack);
                setAudio(false);
            }
        }
    };

    // ---------- Screen sharing ----------
    const toggleScreenShare = async () => {
        if (!screen) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const videoTrack = screenStream.getVideoTracks()[0];
                videoTrack.onended = () => {
                    setScreen(false);
                    if (video) {
                        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                            .then(stream => {
                                const camTrack = stream.getVideoTracks()[0];
                                replaceVideoTrack(camTrack);
                            })
                            .catch(() => {
                                const blackTrack = black();
                                replaceVideoTrack(blackTrack);
                            });
                    } else {
                        const blackTrack = black();
                        replaceVideoTrack(blackTrack);
                    }
                };
                replaceVideoTrack(videoTrack);
                setScreen(true);
            } catch (e) {
                console.log("Screen share cancelled", e);
            }
        } else {
            setScreen(false);
            if (video) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    const camTrack = stream.getVideoTracks()[0];
                    replaceVideoTrack(camTrack);
                } catch {
                    const blackTrack = black();
                    replaceVideoTrack(blackTrack);
                }
            } else {
                const blackTrack = black();
                replaceVideoTrack(blackTrack);
            }
        }
    };

    // ---------- Chat (FIXED - Proper sender tracking) ----------
    const addMessage = (data, sender, socketId) => {
        console.log(data, sender, socketId);

        setMessages((prev) => [
            ...prev,
            {
                sender: sender,
                data: data,
                socketId: socketId,
            },
        ]);

        if (!showChatRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const sendMessage = () => {
        if (!messageInput.trim()) return;

        socketRef.current.emit(
            "chat-message",
            window.location.href,
            messageInput,
            username
        );

        setMessageInput("");
    };

    // ---------- WebRTC signaling handlers ----------
    const setupConnectionHandlers = (peerId) => {
        const pc = connections[peerId];

        // Send our username to this peer
        try {
            socketRef.current.emit("signal", peerId, JSON.stringify({ username: username }));
        } catch (e) {
            console.error("Error sending username signal:", e);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", peerId, JSON.stringify({ ice: event.candidate }));
            }
        };
        pc.ontrack = (event) => {
            console.log("Track received from:", peerId, event.track.kind);
            setVideos(prev => {
                const existing = prev.find(v => v.socketId === peerId);
                const peerUsername = userMapRef.current.get(peerId) || peerId;
                if (existing) {
                    return prev.map(v =>
                        v.socketId === peerId ? { ...v, stream: event.streams[0], username: peerUsername } : v
                    );
                } else {
                    return [...prev, {
                        socketId: peerId,
                        username: peerUsername,
                        stream: event.streams[0],
                        autoPlay: true,
                        playsInline: true
                    }];
                }
            });
        };
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => {
                pc.addTrack(track, window.localStream);
            });
        } else {
            const blackTrack = black();
            const silenceTrack = silence();
            window.localStream = new MediaStream([blackTrack, silenceTrack]);
            window.localStream.getTracks().forEach(track => pc.addTrack(track, window.localStream));
        }
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;

        if (signal.username) {
            userMapRef.current.set(fromId, signal.username);
            setVideos(prev => prev.map(v =>
                v.socketId === fromId ? { ...v, username: signal.username } : v
            ));
            return;
        }

        if (!connections[fromId]) {
            connections[fromId] = new RTCPeerConnection(peerConfigConnections);
            setupConnectionHandlers(fromId);
        }

        if (signal.sdp) {
            connections[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    // Process any queued ICE candidates for this connection
                    if (iceCandidatesQueue[fromId]) {
                        iceCandidatesQueue[fromId].forEach(candidate => {
                            connections[fromId]
                                .addIceCandidate(new RTCIceCandidate(candidate))
                                .catch(e => console.error("Error adding queued ICE candidate:", e));
                        });
                        delete iceCandidatesQueue[fromId];
                    }

                    if (signal.sdp.type === "offer") {
                        return connections[fromId].createAnswer();
                    }
                })
                .then(description => {
                    if (!description) return;
                    return connections[fromId]
                        .setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit(
                                "signal",
                                fromId,
                                JSON.stringify({ sdp: connections[fromId].localDescription })
                            );
                        });
                })
                .catch(console.error);
        }

        if (signal.ice) {
            const pc = connections[fromId];
            if (pc) {
                if (pc.remoteDescription) {
                    pc.addIceCandidate(new RTCIceCandidate(signal.ice))
                        .catch(e => console.error("Error adding ICE candidate directly:", e));
                } else {
                    if (!iceCandidatesQueue[fromId]) {
                        iceCandidatesQueue[fromId] = [];
                    }
                    iceCandidatesQueue[fromId].push(signal.ice);
                }
            }
        }
    };

    // ---------- Connect to socket and join room ----------
    const connectToSocketServer = () => {
        socketRef.current = io.connect(serverUrl, { secure: false });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {

            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            // Store current user's username with their socket ID
            userMapRef.current.set(socketIdRef.current, username);
            console.log("User:", userMapRef.current);

            // Listen for chat messages - both formats
            socketRef.current.on("chat-message", addMessage);
            // socketRef.current.on("chat-message-legacy", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideos(videos => videos.filter(v => v.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
                peerConnectionInitiators.delete(id);
                delete iceCandidatesQueue[id];
                userMapRef.current.delete(id);
            });

            socketRef.current.on("user-joined", (id, clients = []) => {
                const peerIds = id === socketIdRef.current
                    ? clients.filter(clientId => clientId !== socketIdRef.current)
                    : [id];

                peerIds.forEach(peerId => {
                    if (connections[peerId]) {
                        console.log("Connection already exists for:", peerId);
                        return;
                    }
                    connections[peerId] = new RTCPeerConnection(peerConfigConnections);
                    setupConnectionHandlers(peerId);

                    // When a user joins, we should ideally get their username
                    // For now, we'll store it when they send a message
                });

                if (id === socketIdRef.current && peerIds.length > 0) {
                    setTimeout(() => {
                        for (const peerId in connections) {
                            if (peerId === socketIdRef.current) continue;
                            if (connections[peerId].signalingState !== "stable") continue;
                            if (peerConnectionInitiators.has(peerId)) continue;

                            peerConnectionInitiators.add(peerId);
                            connections[peerId]
                                .createOffer({
                                    offerToReceiveVideo: true,
                                    offerToReceiveAudio: true
                                })
                                .then(description => {
                                    return connections[peerId].setLocalDescription(description);
                                })
                                .then(() => {
                                    socketRef.current.emit(
                                        "signal",
                                        peerId,
                                        JSON.stringify({ sdp: connections[peerId].localDescription })
                                    );
                                })
                                .catch(console.error);
                        }
                    }, 500);
                }
            });
        });
    };

    // ---------- Connect button ----------
    const connect = async () => {
        if (!username.trim()) {
            setError(true);
            return;
        }
        setError(false);

        setAskForUsername(false);

        const token = localStorage.getItem("token");
        const roomCode = window.location.pathname.split("/").pop();
        // console.log(roomCode);

        showLoader();
        if (token && roomCode && !localStorage.getItem("currentMeetingId")) {
            try {
                const result = await addToUserHistory(roomCode);
                if (result?.meetingId) {
                    localStorage.setItem("currentMeetingId", String(result.meetingId));
                }
            } catch (err) {
                console.error("Failed to save meeting:", err);
            }
        }

        connectToSocketServer();
        hideLoader();

        showSnackbar("Welcome! You've joined the meeting", "success");
    };

    // ---------- Leave room ----------
    const leaveRoom = async () => {
        const meetingId = localStorage.getItem("currentMeetingId");
        console.log("Leaving room, meeting ID:", meetingId);

        showLoader();
        if (meetingId) {
            try {
                await endMeeting(meetingId);
                localStorage.removeItem("currentMeetingId");
            } catch (err) {
                console.error("Error ending meeting:", err);
                // Continue with cleanup even if endMeeting fails
            }
        }

        // Clean up socket connection
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Clean up media streams
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        for (const id in connections) {
            connections[id].close();
            delete connections[id];
        }
        iceCandidatesQueue = {};
        peerConnectionInitiators.clear();

        // Reset state
        setVideos([]);
        setMessages([]);
        setNewMessages(0);
        setAskForUsername(true);
        userMapRef.current.clear();
        hideLoader();

        if (localStorage.getItem("token")) {
            return navigate("/home");
        } else {
            return navigate("/");
        }
    };

    // ---------- Toggle chat panel ----------
    const toggleChat = () => {
        setShowChat(!showChat);
        if (!showChat) {
            setNewMessages(0);
        }
    };

    const meetingLink = window.location.href;

    const handleLogout = async () => {
        const meetingId = localStorage.getItem("currentMeetingId");
        showLoader();
        if (meetingId) {
            try {
                await endMeeting(meetingId);
                localStorage.removeItem("currentMeetingId");
            } catch (err) {
                console.error("Error ending meeting:", err);
            }
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        for (const id in connections) {
            connections[id].close();
            delete connections[id];
        }
        iceCandidatesQueue = {};
        peerConnectionInitiators.clear();
        localStorage.removeItem("token");
        hideLoader();
        showSnackbar("User logged out successfully!", "success");
        navigate("/auth?mode=login");
    };

    const handleBrandClick = async () => {
        const meetingId = localStorage.getItem("currentMeetingId");
        showLoader();
        if (meetingId) {
            try {
                await endMeeting(meetingId);
                localStorage.removeItem("currentMeetingId");
            } catch (err) {
                console.error("Error ending meeting:", err);
            }
        }
        hideLoader();
        navigate("/");
    };

    const handleCopiedText = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen(false);
        }, 3000)
    };

    // ---------- Render ----------
    return (
        <div>
            {askForUsername ? (
                <div className="videomeet-page">



                    {/* Lobby navbar */}
                    <nav className="navbar">
                        <a onClick={handleBrandClick}
                            className="brand"
                            aria-label="Meetra home">
                            <img src={meetraLogo} alt="" className="brand-logo" />
                            <span>Meetra</span>
                        </a>

                        <div className="nav-actions" aria-label="Main navigation">

                            {localStorage.getItem("token") ? <a onClick={leaveRoom}
                                className="nav-link">
                                Home
                            </a> : <></>}

                            {localStorage.getItem("token") ? <a onClick={handleLogout}
                                className="nav-button">
                                Log Out
                            </a> : <a onClick={() => {
                                navigate("/auth?mode=login");
                            }}
                                className="nav-button">
                                Login
                            </a>}

                        </div>
                    </nav>

                    {/* Decorative doodles (shapes) */}
                    <div className="shape shape-aqua lobby-shape-aqua" aria-hidden="true">
                        <span className="bubble bubble-yeah">yeay!</span>
                        <span className="eye eye-aqua" />
                        <span className="mouth mouth-smile aqua-smile" />
                    </div>

                    <div className="shape shape-orange lobby-shape-orange" aria-hidden="true">
                        <span className="doodle-x-label lobby-x-left">X</span>
                        <span className="eye eye-left" />
                        <span className="mouth mouth-flat" />
                        <span className="accent accent-left" />
                    </div>

                    <div className="shape shape-pink lobby-shape-pink" aria-hidden="true">
                        <span className="eye eye-pink-left" />
                        <span className="eye eye-pink-right" />
                        <span className="split-line" />
                    </div>

                    <div className="shape shape-yellow lobby-shape-yellow-bottom" aria-hidden="true">
                        <span className="bubble bubble-hola">Hola!</span>
                        <span className="eye eye-right" />
                        <span className="mouth mouth-beak" />
                        <span className="accent accent-right" />
                    </div>

                    <div className="shape shape-yellow lobby-shape-yellow-right" aria-hidden="true">
                        <span className="doodle-x-label lobby-x-right">X</span>
                        <span className="eye eye-left" />
                        <span className="mouth mouth-flat" />
                    </div>

                    <div className="meet-orbit-badge" aria-hidden="true">
                        <div className="meet-orbit-logo-box">
                            <img src={meetraLogo} alt="" className="meet-orbit-logo-img" />
                        </div>
                        <div className="meet-orbit-ring" />
                        <div className="meet-orbit-ring-outer" />
                        <div className="meet-orbit-node" />
                    </div>

                    {/* Main content grid */}
                    <div className="lobby-grid">
                        <div className="lobby-card">
                            <h2 className="lobby-title">Enter Into Lobby</h2>
                            <span className="lobby-field-label">Username</span>
                            <TextField
                                className="lobby-input"
                                id="outlined-basic"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError(false);
                                }}
                                error={error}
                                helperText={error ? "Please enter username" : ""}
                                variant="outlined"
                                fullWidth
                                size="small"
                                required
                            />
                            <Button className="lobby-connect-btn" variant="contained" onClick={connect}>Connect</Button>
                        </div>

                        <div className="lobby-right">
                            <div className="lobby-video-preview-card">
                                <video ref={localVideoRef} autoPlay muted className="lobby-video-el"></video>
                                {!video && (
                                    <div className="lobby-muted-overlay">
                                        <div className="lobby-muted-box">
                                            <VideocamOffIcon className="lobby-muted-icon" />
                                            <span>Muted</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lobby-link-card">
                                <span className="lobby-field-label">Meeting Link</span>

                                {open === true ? <span className="copied">Copied</span> : <></>}
                                <TextField
                                    className="lobby-input"
                                    fullWidth
                                    size="small"
                                    value={meetingLink}
                                    inputprops={{
                                        readOnly: true
                                    }}
                                />

                                <Button
                                    className="lobby-connect-btn"
                                    variant="contained"
                                    onClick={() => {
                                        navigator.clipboard.writeText(meetingLink);
                                        handleCopiedText();
                                    }}
                                >
                                    Copy Link
                                </Button>
                                <div className="link-card-badge" />
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="videomeet-meet-page">

                    {/* Header navbar */}
                    <nav className="navbar">
                        <a onClick={handleBrandClick}
                            className="brand"
                            aria-label="Meetra home">
                            <img src={meetraLogo} alt="" className="brand-logo" />
                            <span>Meetra</span>
                        </a>

                        <div className="nav-actions" aria-label="Main navigation">

                            {localStorage.getItem("token") ? <a onClick={leaveRoom}
                                className="nav-link">
                                Home
                            </a> : <></>}

                            {localStorage.getItem("token") ? <a onClick={handleLogout}
                                className="nav-button">
                                Log Out
                            </a> : <a onClick={() => {
                                navigate("/auth?mode=login");
                            }}
                                className="nav-button">
                                Login
                            </a>}

                        </div>
                    </nav>

                    <h1 className="meet-page-title">Have a nice chat :)</h1>

                    {/* Decorative doodles (shapes) */}
                    <div className="shape shape-aqua lobby-shape-aqua" aria-hidden="true" style={{ top: '15%' }}>
                        <span className="bubble bubble-yeah">yeay!</span>
                        <span className="eye eye-aqua" />
                        <span className="mouth mouth-smile aqua-smile" />
                    </div>

                    <div className="shape shape-yellow lobby-shape-yellow-right" aria-hidden="true" style={{ top: '35%' }}>
                        <span className="doodle-x-label lobby-x-right">X</span>
                        <span className="eye eye-left" />
                        <span className="mouth mouth-flat" />
                    </div>

                    {/* Dashboard board */}
                    <div className={`meet-dashboard ${videos.length === 0 ? "video-layout-solo" : videos.length === 1 ? "video-layout-pair" : "video-layout-grid"}`}>

                        {/* Meet Controls row */}
                        <div className="meet-controls-row">
                            <IconButton className="meet-icon-btn" onClick={toggleVideo}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            <IconButton className="meet-icon-btn" onClick={toggleAudio}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                            {screenAvailable && (
                                <IconButton className="meet-icon-btn" onClick={toggleScreenShare}>
                                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            )}
                            <Badge badgeContent={showChat ? 0 : newMessages} max={999} sx={{
                                "& .MuiBadge-badge": {
                                    backgroundColor: "#9dd8d5",
                                    color: "#000",
                                    border: "2px solid black",
                                    height: "25px",
                                    aspectRatio: "1 / 1",
                                    borderRadius: "50%",
                                    position: "absolute",
                                    right: "2px"
                                },
                            }}>
                                <IconButton className="meet-icon-btn" onClick={toggleChat}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                            <IconButton className="meet-icon-btn meet-icon-btn-end" onClick={leaveRoom}>
                                <CallEndIcon />
                            </IconButton>
                        </div>

                        <div className="videos-wrapper">
                            {/* Local user video card */}
                            <div className="local-video-card">
                                <div className="local-video-header-label">{`${username} (You)` || "You"}</div>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    className="local-video-element"
                                />
                                <div className="local-video-controls-overlay">
                                    {audio ? <MicIcon className="overlay-status-icon" /> : <MicOffIcon className="overlay-status-icon" />}
                                    {video ? <VideocamIcon className="overlay-status-icon" /> : <VideocamOffIcon className="overlay-status-icon" />}
                                </div>
                            </div>

                            {/* Remote participants cards */}
                            {videos.map((videoData) => (
                                <div key={videoData.socketId} className="remote-user-card">

                                    <h4 className="remote-user-title">{videoData.username || videoData.socketId}</h4>
                                    <video
                                        autoPlay
                                        playsInline
                                        muted={false}
                                        className="remote-video-el"
                                        ref={(ref) => {
                                            if (ref && videoData.stream) {
                                                if (ref.srcObject !== videoData.stream) {
                                                    ref.srcObject = videoData.stream;
                                                    ref.play().catch(e => console.log("Remote video play error", e));
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Panel Drawer */}
                    {showChat && (
                        <div className="meet-chat-drawer">
                            <div className="chat-drawer-header">
                                <span>Chat</span>
                                <IconButton size="small" className="chat-drawer-close" onClick={toggleChat}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <div className="chat-drawer-messages">
                                {messages.map((msg, idx) => {
                                    const isLocal = msg.socketId === socketIdRef.current;
                                    return (
                                        <div key={idx} className={`chat-bubble ${isLocal ? "chat-bubble-right" : "chat-bubble-left"}`}>
                                            <span className="chat-bubble-sender">{isLocal ? "You" : msg.sender}:</span> {msg.data}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="chat-drawer-footer">
                                <TextField
                                    className="chat-input-el"
                                    fullWidth
                                    size="small"
                                    placeholder="Type a message"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <IconButton className="chat-send-icon-btn" onClick={sendMessage}>
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}