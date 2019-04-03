// ref: https://github.com/jscriptcoder/tfjs-posenet/blob/master/src/PoseNet/index.jsx

// main imports
import React, { useState, useEffect, useRef } from "react";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";

// styles
import styles from "./index.module.css";

// components
import { isMobile, drawKeypoints, drawSkeleton } from "./helpers/utils";
import scoreSimilarity from "./helpers/scorer";

// ghost (the dance move you're competing with)
import DANCER from "./data/ROBOT_RAHMAT.json";
const GHOST = DANCER.poseRecords;

const WebcamSource = ({ height, width, facingMode }) => {
  const webcamRef = useRef();

  const [dims, setDims] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const setupCamera = async () => {
      // MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const e1 =
          "Browser API navigator.mediaDevices.getUserMedia not available";
        this.setState({ error_messages: e1 });
        throw e1;
      }

      const video = webcamRef.current.video;

      console.log(video);
    };

    const v = webcamRef.current.video;
    const height = v.height;
    const width = v.width;

    setDims({ height: height, width: width });
    setupCamera();
  }, []);

  const videoConstraints = {
    width: width,
    height: height,
    facingMode: facingMode
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start"
      }}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        height={height}
        width={width}
        videoConstraints={videoConstraints}
      />
    </div>
  );
};

const Posenet = props => {
  console.log(props);

  return (
    <WebcamSource
      height={props.videoHeight}
      width={props.videoWidth}
      facingMode={props.frontCamera ? "user" : "environment"}
    />
  );
};

Posenet.defaultProps = {
  videoWidth: 600,
  videoHeight: 500,
  algorithm: "single-pose",
  mobileNetArchitecture: isMobile() ? 0.5 : 1.01,
  showVideo: true,
  showSkeleton: true,
  showPoints: true,
  minPoseConfidence: 0.1,
  minPartConfidence: 0.1,
  maxPoseDetections: 2,
  nmsRadius: 20.0,
  outputStride: 16,
  imageScaleFactor: 0.5,
  skeletonColor: "aqua",
  ghostColor: "yellow",
  skeletonLineWidth: 8,
  loadingText: "Loading pose detector...",
  frontCamera: true,
  stop: false,
  record: false,
  recordVideo: false,
  maxFPS: 30,
  compete: true
};

export default Posenet;
