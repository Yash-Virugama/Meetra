// import "../styles/Loader.css";

// export default function Loader() {
//     return (
//         <div className="loader-overlay">
//             <div className="spinner"></div>
//         </div>
//     );
// }

import "../styles/Loader.css";

export default function Loader() {
    return (
        <div className="loader-overlay">
            <div className="loader-container">
                <div className="loader-shapes">
                    <div className="loader-shape loader-circle" />
                    <div className="loader-shape loader-square" />
                    <div className="loader-shape loader-capsule" />
                </div>
                <div className="loader-text">
                    Loading
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                </div>
            </div>
        </div>
    );
}