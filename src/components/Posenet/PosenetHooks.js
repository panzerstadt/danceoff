// ref: https://github.com/jscriptcoder/tfjs-posenet/blob/master/src/PoseNet/index.jsx

// main imports
import React, { Component } from "react";
import * as posenet from "@tensorflow-models/posenet";

// styles
import styles from "./index.module.css";

// components
import { isMobile, drawKeypoints, drawSkeleton } from "./helpers/utils";
import scoreSimilarity from "./helpers/scorer";

// ghost (the dance move you're competing with)
import DANCER from "./data/ROBOT_RAHMAT.json";
const GHOST = DANCER.poseRecords;

const Posenet = props => {
  console.log(props);
  return (
    <div>
      <p>hey</p>
    </div>
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
