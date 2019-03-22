import React, { useEffect, useState } from "react";
import styles from "./index.module.css";

import Posenet from "../../components/Posenet";

const MAX_WIDTH = 375;

const Page = ({ onScore }) => {
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("");
  const [dims, setDims] = useState({ height: 0, width: 0 });
  useEffect(() => {
    // didmount
    console.log("mounted this page yo");
    setDims({
      height: window.innerHeight,
      width: Math.min(window.innerWidth, MAX_WIDTH)
    });

    // show modal, prepare user to start
    setPhase("start");

    return () => console.log("unmounted this page yo");
  }, []);

  const handleClick = type => {
    if (type === "start") {
      setPhase("play");
    } else if (type === "end") {
      setPhase("submit");
      if (onScore) {
        onScore(score);
      }
    }
  };

  // handles live recording of pose
  const onTracePose = p => {};

  const onTraceVideo = v => {
    //console.log(v)
  };

  // when one loop ends, trigger this
  const handleRecordEnd = score => {
    console.log("SCORE IS");
    console.log(score);
    setScore(score);
    setPhase("end");
  };

  const Modal = ({ type, onClick, score }) => {
    if (type === "start") {
      return (
        <div className={styles.modalStart}>
          <p>Ready to go?</p>
          <button onClick={() => onClick(type)}>START!</button>
        </div>
      );
    } else if (type === "end") {
      return (
        <div className={styles.modalEnd}>
          <p>your score is {score}</p>
          <p>do do you want to submit?</p>
          <button onClick={() => onClick(type)}>SUBMIT</button>
        </div>
      );
    } else if (type === "play") {
      return (
        <Posenet
          onEnd={handleRecordEnd}
          videoWidth={dims.width}
          videoHeight={dims.height}
          mobileNetArchitecture={0.5}
          outputStride={8}
          loadingText={"Loading..."}
          frontCamera={true}
          getPoseRecords={onTracePose}
          getVideoRecords={onTraceVideo}
          showVideo={true}
          algorithm={"single-pose"}
          record={true}
          recordVideo
        />
      );
    } else {
      return null;
    }
  };

  return (
    <div className={styles.page}>
      <Modal type={phase} onClick={handleClick} score={score} />
    </div>
  );
};

export default Page;
