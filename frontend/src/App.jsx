import './App.css';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from './pages/Landing.jsx';
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeet from './pages/VideoMeet.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import ErrorPage from './pages/Error.jsx';
import { SnackbarProvider } from './contexts/SnackbarContext.jsx';
import ProtectedRoute from './utils/ProtectedRoute.jsx';
import { LoadingProvider } from './contexts/LoadingContext.jsx';

function App() {

  return (
    <div className='App'>
      <Router>

        <LoadingProvider>

          <SnackbarProvider>

            <AuthProvider>

              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Authentication />} />
                <Route path="/home" element={<Home />} />
                <Route path="/history" element={<History />} />

                <Route path="/guest/:roomId" element={<VideoMeet />} />

                <Route path="/meeting/:meetingCode" element={<ProtectedRoute>
                  <VideoMeet />
                </ProtectedRoute>} />

                <Route path="/error" element={<ErrorPage />} />

                <Route path="*" element={<ErrorPage />} />
              </Routes>

            </AuthProvider>

          </SnackbarProvider>

        </LoadingProvider>

      </Router>
    </div>
  );
}

export default App;
