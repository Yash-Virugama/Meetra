import "../styles/Authentication.css";
import { useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import HeroArt from "../components/HeroArt.jsx";
import { SnackbarContext } from "../contexts/SnackbarContext.jsx";
import { LoadingContext } from "../contexts/LoadingContext.jsx";

export default function Authentication() {
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    username: "",
    password: "",
    submit: ""
  });
  const [formState, setFormState] = useState(0);
  const { handleRegister, handleLogin } = useContext(AuthContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const { showLoader, hideLoader } = useContext(LoadingContext);

  useEffect(() => {
        hideLoader();
    }, [location.pathname, hideLoader]);

  const validateNameField = (val) => {
    const value = val.trim();
    if (value.length === 0) {
      return "Name is required.";
    }
    if (value.length < 3) {
      return "Name must be at least 3 characters.";
    }
    if (value.length > 50) {
      return "Name cannot exceed 50 characters.";
    }
    const regex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
    if (!regex.test(value)) {
      return "Name can only contain letters, spaces, apostrophes (') and hyphens (-).";
    }
    return "";
  };

  const validateUsernameField = (val) => {
    const value = val.trim();
    if (value.length === 0) {
      return "Username is required.";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (value.length > 20) {
      return "Username cannot exceed 20 characters.";
    }
    const regex = /^[a-zA-Z0-9._]+$/;
    if (!regex.test(val)) {
      return "Only letters, numbers, periods (.) and underscores (_) are allowed.";
    }
    return "";
  };

  const validatePasswordField = (val) => {
    if (val.length === 0) {
      return "Password is required.";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (val.length > 64) {
      return "Password cannot exceed 64 characters.";
    }
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=[\]{};':"\\|,.<>/?]).{6,64}$/;
    if (!regex.test(val)) {
      return "Password must contain an uppercase letter, lowercase letter, number, and special character.";
    }
    return "";
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (errors.name) {
      const err = validateNameField(val);
      setErrors(prev => ({ ...prev, name: err, submit: "" }));
    }
  };

  const handleNameBlur = () => {
    if (formState === 1) {
      const err = validateNameField(name);
      setErrors(prev => ({ ...prev, name: err }));
    }
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);

    const regex = /^[a-zA-Z0-9._]*$/;
    if (val && !regex.test(val)) {
      setErrors(prev => ({
        ...prev,
        username: "Only letters, numbers, periods (.) and underscores (_) are allowed.",
        submit: ""
      }));
    } else {
      if (errors.username) {
        const err = validateUsernameField(val);
        setErrors(prev => ({ ...prev, username: err, submit: "" }));
      }
    }
  };

  const handleUsernameBlur = () => {
    if (formState === 1) {
      const err = validateUsernameField(username);
      setErrors(prev => ({ ...prev, username: err }));
    } else {
      const err = !username.trim() ? "Username is required." : "";
      setErrors(prev => ({ ...prev, username: err }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (errors.password) {
      const err = validatePasswordField(val);
      setErrors(prev => ({ ...prev, password: err, submit: "" }));
    }
  };

  const handlePasswordBlur = () => {
    if (formState === 1) {
      const err = validatePasswordField(password);
      setErrors(prev => ({ ...prev, password: err }));
    } else {
      const err = !password ? "Password is required." : "";
      setErrors(prev => ({ ...prev, password: err }));
    }
  };

  const handleAuth = async () => {
    try {
      setErrors(prev => ({ ...prev, submit: "" }));

      if (formState === 0) {
        const userErr = !username.trim() ? "Username is required." : "";
        const passErr = !password ? "Password is required." : "";

        if (userErr || passErr) {
          setErrors(prev => ({
            ...prev,
            username: userErr,
            password: passErr,
            submit: "Please fill all fields"
          }));
          return;
        }

        await handleLogin(username.trim(), password);

        setName("");
        setUsername("");
        setPassword("");
        setFormState(1);

        return;
      }

      const nameErr = validateNameField(name);
      const usernameErr = validateUsernameField(username);
      const passwordErr = validatePasswordField(password);

      if (nameErr || usernameErr || passwordErr) {
        setErrors({
          name: nameErr,
          username: usernameErr,
          password: passwordErr,
          submit: ""
        });
        return;
      }

      await handleRegister(name.trim(), username.trim(), password);

      setName("");
      setUsername("");
      setPassword("");
      setFormState(0);

    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors.join(", ")) ||
        err.message ||
        "Something went wrong";

      setErrors(prev => ({ ...prev, submit: errorMessage }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleAuth();
  };

  const handleModeChange = (mode) => {
    setFormState(mode);
    setErrors({ name: "", username: "", password: "", submit: "" });
  };

  useEffect(() => {
  const mode = new URLSearchParams(location.search).get("mode");

  setFormState(mode === "register" ? 1 : 0);

  // Clear form
  setName("");
  setUsername("");
  setPassword("");

  // Clear errors
  setErrors({
    name: "",
    username: "",
    password: "",
    submit: "",
  });
}, [location.search]);

  useEffect(() => {
    if (location.state?.snackbar) {
      showSnackbar(location.state.snackbar.message, location.state.snackbar.severity);

      // Clear state so snackbar doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, showSnackbar]);

  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      transition:
        "box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease",
      "& fieldset": {
        borderColor: "rgba(18, 18, 22, 0.16)",
      },
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 10px 22px rgba(18, 18, 22, 0.08)",
      },
      "&:hover fieldset": {
        borderColor: "#e78260",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#e78260",
        borderWidth: "2px",
      },
    },
    "& .MuiInputBase-input": {
      paddingTop: "12px",
      paddingBottom: "12px",
      fontSize: "15px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "15px",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#d46f4f",
    },
  };

  const activeError =
    errors.submit || errors.name || errors.username || errors.password;

  return (
    <main className="auth-page">

      <Navbar />

      <section className="auth-shell" aria-labelledby="auth-title">

        <div className="auth-hero-art">
          <HeroArt />
        </div>

        <div className="auth-form-panel">
          <div className={formState === 1 ? "auth-card signup-mode" : "auth-card"}>
            <div className="auth-card-header">
              <p>{formState === 0 ? "Welcome back" : "Create your account"}</p>
              <h2 id="auth-title">
                {formState === 0 ? "Login to Meetra" : "Join Meetra today"}
              </h2>
            </div>

            <div className="auth-switch" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={formState === 0 ? "auth-tab active" : "auth-tab"}
                onClick={() => handleModeChange(0)}
                role="tab"
                aria-selected={formState === 0}
              >
                Login
              </button>
              <button
                type="button"
                className={formState === 1 ? "auth-tab active" : "auth-tab"}
                onClick={() => handleModeChange(1)}
                role="tab"
                aria-selected={formState === 1}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-fields">
                {formState === 1 && (
                  <TextField
                    required
                    size="small"
                    fullWidth
                    id="fullname"
                    name="fullname"
                    label="Full Name"
                    value={name}
                    autoFocus
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    error={Boolean(errors.name)}
                    sx={fieldStyles}
                    inputProps={{ maxLength: 50 }}
                  />
                )}

                <TextField
                  required
                  size="small"
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={username}
                  autoFocus={formState === 0}
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  error={Boolean(errors.username)}
                  sx={fieldStyles}
                  inputProps={{ minLength: 3, maxLength: 20 }}
                />

                <TextField
                  required
                  size="small"
                  fullWidth
                  type="password"
                  id="password"
                  label="Password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={Boolean(errors.password)}
                  sx={fieldStyles}
                  inputProps={{ minLength: 6, maxLength: 64 }}
                />
              </div>

              <p className={activeError ? "auth-error visible" : "auth-error"}>
                {activeError || " "}
              </p>

              <button type="submit" className="auth-submit">
                {formState === 0 ? "Login" : "Register"}
              </button>
            </form>

            <p className="auth-helper">
              {formState === 0

                ? <span>
                  New here? Switch to
                  <a className={formState === 1 ? "auth-tab active" : "auth-tab"}
                    onClick={() => handleModeChange(1)}
                    role="tab"
                    aria-selected={formState === 1}
                  > Sign Up
                  </a> and start your first room.
                </span>

                : <span>Already have an account?
                  <a className={formState === 0 ? "auth-tab active" : "auth-tab"}
                    onClick={() => handleModeChange(0)}
                    role="tab"
                    aria-selected={formState === 0}
                  > Login
                  </a> and jump back in.</span>
              }
            </p>
          </div>
        </div>
      </section>



    </main>
  );
}
