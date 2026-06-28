import meetingVideo from "../assets/meeting-video.mp4";

export default function HeroArt() {
    return (
        <>
            <div className="hero-art" aria-hidden="true">
                <div className="character-grid">
                    <div className="shape shape-orange">
                        <span className="eye eye-left" />
                        <span className="mouth mouth-flat" />
                        <span className="accent accent-left" />
                    </div>
                    <div className="shape shape-purple">
                        <span className="bubble bubble-yeah">yeay!</span>
                        <span className="mouth mouth-smile" />
                    </div>
                    <div className="shape shape-video">
                        <span className="bubble bubble-fun">So Fun!!</span>

                        <video
                            className="profile-video"
                            autoPlay
                            muted
                            loop
                            playsInline
                        >
                            <source src={meetingVideo} type="video/mp4" />
                        </video>
                    </div>
                    <div className="shape shape-yellow">
                        <span className="eye eye-right" />
                        <span className="mouth mouth-beak" />
                        <span className="accent accent-right" />
                    </div>
                    <div className="shape shape-pink">
                        <span className="eye eye-pink-left" />
                        <span className="eye eye-pink-right" />
                        <span className="split-line" />
                    </div>
                    <div className="shape shape-aqua">
                        <span className="bubble bubble-hola">Hola!</span>
                        <span className="eye eye-aqua" />
                        <span className="mouth mouth-smile aqua-smile" />
                    </div>
                </div>
            </div>
        </>
    )
}
