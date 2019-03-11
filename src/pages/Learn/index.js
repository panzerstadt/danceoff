import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import { Direction, Slider, PlayerIcon } from "react-player-controls";

import styles from "./index.module.css";

import { ReactComponent as LoopIcon } from "../../assets/svg/loop.svg";
import video from "../../assets/videos/video.mp4";

const Page = () => {
  const [loop, setLoop] = useState(true);
  const [play, setPlay] = useState(true);

  // update slider progress
  const [progress, setProgress] = useState();
  const [seekVal, setSeekVal] = useState(0);
  useEffect(() => {
    if (progress) {
      // there's more stuff
      const fraction = progress.played;
      setSeekVal(fraction);
    }
  }, [progress]);

  // seek slider
  const [loaded, setLoaded] = useState(false);
  const [seek, setSeek] = useState(0);
  const playerRef = useRef();
  useEffect(() => {
    if (loaded && playerRef) {
      playerRef.current.seekTo(seek);
      setSeekVal(seek);
    }
  }, [seek]);
  const scrubVideo = e => {
    setSeek(e);
  };

  // style slider and slider handle
  const SliderBar = ({ direction, value, style, className }) => (
    <div className={className} style={style} />
  );
  const SliderHandle = ({ direction, value, style, className }) => (
    <div
      className={className}
      style={Object.assign(
        {},
        {
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "100%"
        },
        direction === Direction.HORIZONTAL
          ? {
              top: 0,
              left: `${value * 100}%`,
              marginTop: -4,
              marginLeft: -8
            }
          : {
              left: 0,
              bottom: `${value * 100}%`,
              marginBottom: -8,
              marginLeft: -4
            },
        style
      )}
    />
  );

  return (
    <div className={styles.page}>
      <ReactPlayer
        ref={playerRef}
        height="100%"
        url={video}
        playing={play}
        loop={loop}
        onProgress={setProgress}
        onReady={() => setLoaded(true)}
      />
      <div className={styles.videoControls}>
        {/* <div className={styles.seekBar}>
          <button className={styles.seekBtn} />{" "}
        </div> */}
        <Slider onChange={scrubVideo} direction={Direction.HORIZONTAL}>
          <SliderBar
            className={styles.seekBar}
            value={seekVal}
            direction={Direction.HORIZONTAL}
          />
          <SliderHandle
            className={styles.seekBtn}
            value={seekVal}
            direction={Direction.HORIZONTAL}
          />
        </Slider>

        <div className={styles.buttons}>
          <p className={styles.dummy} />
          <button className={styles.playPause} onClick={() => setPlay(!play)}>
            {play ? (
              <PlayerIcon.Pause height={20} />
            ) : (
              <PlayerIcon.Play height={20} />
            )}
          </button>
          <button className={styles.loop} onClick={() => setLoop(!loop)}>
            <LoopIcon className={loop ? styles.activeLoop : styles.loopIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
