import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function CustomSnackbar({
    open,
    onClose,
    severity = "info",
    message
}) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={3000}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left"
            }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{
                    width: "100%",
                    backgroundColor:
                        severity === "success"
                            ? "rgba(89, 168, 164, 0.88)"
                            : severity === "error"
                                ? "rgba(233, 128, 12, 0.8)"
                                : severity === "warning"
                                    ? "rgba(0, 0, 0, 0.7)"
                                    : "rgba(149, 132, 223, 0.8)",
                    color: severity === "warning" ? "#fffffff4" : "white"
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}