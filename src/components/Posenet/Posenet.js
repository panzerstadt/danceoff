// ref: https://github.com/jscriptcoder/tfjs-posenet/blob/master/src/PoseNet/index.jsx

// main imports
import React, { Component } from "react";
import * as posenet from "@tensorflow-models/posenet";

import Webcam from "react-webcam";

// styles
import styles from "./index.module.css";

// components
import { isMobile, drawKeypoints, drawSkeleton } from "./helpers/utils";
import scoreSimilarity from "./helpers/scorer";

// ghost (the dance move you're competing with)
import RECORD from "./data/BASEBALL.json";
const GHOST = RECORD.poseRecords;

export default class PoseNetComponent extends Component {
  static defaultProps = {
    videoWidth: window.innerWidth,
    videoHeight: window.innerHeight,
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
    imageScaleFactor: 0.3,
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

  state = {
    loading: true,
    error_messages: "",
    stream: null,
    trace: [],
    frames: [],
    ghostIndex: 0,
    repeat: false,
    score: 0,
    totalScore: 0,
    scoreOpacity: 0,
    time: 0,
    stop: false,
    finalDims: { height: 0, width: 0 }
  };
  camera = undefined;
  timeout = undefined;
  good_keypoints = {};
  previousDelta = 0;
  lastScore = 0;

  errorMessages = () => {
    // pipe out error messages
    if (this.props.errorMessages) {
      this.props.errorMessages(this.state.error_messages);
    }
  };

  // the traced sequence
  getPoseRecords() {
    if (this.props.getPoseRecords) {
      this.props.getPoseRecords(this.state.trace);
    }
  }

  getVideoRecords = () => {
    if (this.props.getVideoRecords) {
      this.props.getVideoRecords(this.state.frames);
    }
  };

  tracePose = poses => {
    if (this.props.record) {
      this.setState({ trace: [...this.state.trace, poses] });
    }
  };

  traceVideo = blob => {
    if (this.props.record) {
      this.setState({ frames: [...this.state.frames, blob] });
    }
  };

  getCanvas = elem => {
    this.canvas = elem;
  };

  getVideo = elem => {
    try {
      this.video = elem.video; // react-webcam
    } catch (e) {
      this.video = elem; // html5 video tag
    }
  };

  stopCamera = () => {
    const cam = this.camera;
    if (cam) {
      const stream = cam.srcObject;
      const tracks = stream.getTracks();

      // stop all tracks
      tracks.map(t => t.stop());
      this.camera = undefined;
      this.setState({ loading: true, stop: true });
    }
  };

  startCamera = () => {
    const cam = this.camera;
    if (cam) {
      this.setState({ loading: false, stop: false });
    } else {
      this.stopCamera();
    }
  };

  setupCamera = async () => {
    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const e1 =
        "Browser API navigator.mediaDevices.getUserMedia not available";
      this.setState({ error_messages: e1 });
      throw e1;
    }

    const { videoWidth, videoHeight } = this.props;
    const video = this.video;
    const mobile = isMobile();
    const frontCamera = this.props.frontCamera;

    video.width = videoWidth;
    video.height = videoHeight;
    video.style.objectFit = "contain";

    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // const stream = await navigator.mediaDevices.getUserMedia({
    //   audio: false,
    //   video: {
    //     facingMode: frontCamera ? "user" : { exact: "environment" },
    //     // width: videoWidth,
    //     // height: videoHeight
    //     width: mobile ? void 0 : videoWidth,
    //     height: mobile ? void 0 : videoHeight
    //   }
    // });

    // video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        // Once the video metadata is ready, we can start streaming video
        video.play();

        const finalDims = {
          height: video.videoHeight, // actual video running
          width: video.videoWidth
        };

        video.width = video.videoWidth;
        video.height = video.videoHeight;

        this.setState({ finalDims });
        resolve(video); // promise returns video
      };
    });
  };

  detectPose = () => {
    //const { videoWidth, videoHeight } = this.props;
    const videoWidth = this.state.finalDims.width;
    const videoHeight = this.state.finalDims.height;

    const canvas = this.canvas;
    const ctx = canvas.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    this.poseDetectionFrame(ctx);
  };

  poseDetectionFrame = ctx => {
    const {
      algorithm,
      imageScaleFactor,
      forceFlipHorizontal,
      outputStride,
      minPoseConfidence,
      maxPoseDetections,
      minPartConfidence,
      nmsRadius,
      //videoWidth,
      //videoHeight,
      showVideo,
      showPoints,
      showSkeleton,
      skeletonColor,
      ghostColor,
      translateGhost,
      skeletonLineWidth,
      frontCamera,
      stop,
      maxFPS,
      compete
    } = this.props;

    const { finalDims } = this.state;

    const videoHeight = finalDims.height;
    const videoWidth = finalDims.width;

    const net = this.net;
    const video = this.video;

    const flipped = forceFlipHorizontal
      ? forceFlipHorizontal
      : frontCamera
      ? true
      : false;

    const poseDetectionFrameInner = async currentDelta => {
      // stops running if complete
      if (this.props.stop || this.state.stop || !this.camera) {
        return;
      }
      // this is to cap fps
      //requestAnimationFrame(poseDetectionFrameInner);
      requestAnimationFrame(poseDetectionFrameInner);
      const delta = parseInt(currentDelta - this.previousDelta);
      const maxDelta = parseInt(1000 / maxFPS);

      // another way to count fps
      // see how many repeats of each second shows up on the console
      //console.log(parseInt(performance.now() / 1000));

      // ^ above == "how long did it take to get here since the last frame in ms?"
      if (maxFPS && delta < maxDelta) {
        // 1000 / fps == frames per millisecond
        console.log("capped!", delta);

        return;
      }

      // pose calculation starts here
      let poses = [];

      switch (algorithm) {
        case "single-pose":
          const pose = await net.estimateSinglePose(
            video,
            imageScaleFactor,
            flipped,
            outputStride
          );

          poses.push(pose);
          break;

        case "multi-pose":
          poses = await net.estimateMultiplePoses(
            video,
            imageScaleFactor,
            flipped,
            outputStride,
            maxPoseDetections,
            minPartConfidence,
            nmsRadius
          );

          break;
      }

      // CLEAR SCREEN
      // ------------
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      // SHOW VIDEO FRAME
      // ----------------
      if (showVideo) {
        ctx.save();
        if (flipped) {
          // https://christianheilmann.com/2013/07/19/flipping-the-image-when-accessing-the-laptop-camera-with-getusermedia/
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
        }
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        ctx.restore();
      }

      // DRAW CURRENT PREDICTION
      // -----------------------
      // For each pose (i.e. person) detected in an image, loop through the poses
      // and draw the resulting skeleton and keypoints if over certain confidence
      // scores
      poses.forEach(({ score, keypoints }) => {
        if (score >= minPoseConfidence) {
          if (showPoints) {
            drawKeypoints(keypoints, minPartConfidence, skeletonColor, ctx);
          }
          if (showSkeleton) {
            drawSkeleton(
              keypoints,
              minPartConfidence,
              skeletonColor,
              skeletonLineWidth,
              ctx
            );
          }
        }
      });

      // DRAW GHOST DANCER
      // -----------------
      if (compete) {
        // if compete is triggered, start timer
        // trigger is the same as record
        if (this.state.time === 0) {
          this.setState({ time: performance.now() });
        }

        if (!GHOST[this.state.ghostIndex]) {
          // end of loop
          console.log("RESET!!!!");
          const millis = performance.now() - this.state.time;
          console.log("seconds elapsed = " + Math.floor(millis / 1000));

          // for now, repeat loop
          if (this.state.repeat) {
            // ENDLESS MODE FTW
            this.setState({ ghostIndex: 0 });
          } else {
            this.stopCamera();
            if (this.props.onEnd) {
              this.props.onEnd(this.state.totalScore);
            }
            this.setState({
              totalScore: 0,
              time: performance.now(),
              stop: true
            });
          }
        } else {
          const ind = this.state.ghostIndex;
          const g_keypoints = GHOST[ind].pose[0].keypoints;
          const g_score = GHOST[ind].pose[0].score;

          const g_timestamp = GHOST[ind].timestamp;
          const timestamp_now = (performance.now() - this.state.time) / 1000;

          console.log(`REC: ${g_timestamp} NOW: ${timestamp_now}`);

          if (g_score >= minPoseConfidence) {
            // only update keypoints when it passes the confidence threshold
            this.good_keypoints = g_keypoints;
          }
          // else use the previous one
          if (showPoints) {
            drawKeypoints(
              this.good_keypoints,
              minPartConfidence,
              ghostColor,
              ctx
            );
          }
          if (showSkeleton) {
            drawSkeleton(
              this.good_keypoints,
              minPartConfidence,
              ghostColor,
              skeletonLineWidth,
              ctx
            );
          }

          // SCORE USER AGAINST GHOST
          const userPose = poses[0];
          const similarity = scoreSimilarity(
            userPose,
            this.state.ghostIndex, // TODO: change this to g_timestamp
            GHOST
          );

          console.log(similarity.score.highest);

          const score = parseInt(similarity.score.normalized.toFixed(2));
          this.setState(prev => ({
            score: score,
            totalScore: prev.totalScore + score
          }));
        }
      }

      // SHOW OUTPUT
      // -----------
      if (stop || this.state.stop || !this.camera) {
        console.log("complete!");
        // clear canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);
      } else {
        const singlePose = poses.slice(0, 1);
        // to prevent multipose from screwing data
        // it only keeps the highest
        // TODO: allow multi pose recordings

        if (this.props.record) {
          // if record is triggered, start timer
          if (this.state.time === 0) {
            this.setState({ time: performance.now() });
          }

          if (this.props.recordVideo) {
            //console.log("recording frame and video!");
          } else {
            //console.log("recording frames!");
          }
          // trace with timestamp
          // https://stackoverflow.com/questions/8279729/calculate-fps-in-canvas-using-requestanimationframe
          this.tracePose({
            pose: singlePose,
            timestamp: (performance.now() - this.state.time) / 1000
          });
          // record video
          this.canvas.toBlob(this.traceVideo, "image/jpeg", 0.4);

          // stream poses to parent
          this.getPoseRecords();
          this.getVideoRecords();
        } else if (!this.props.record && this.state.time !== 0) {
          this.setState({ time: 0 });
        }

        // call next recursion
        // ONLY IF THE TIMESTAMP OF RECORD IS SLOWER THAN CURRENT TIMESTAMP
        const REC = GHOST[this.state.ghostIndex].timestamp.toFixed(5);
        const NOW = ((performance.now() - this.state.time) / 1000).toFixed(5);

        if (REC < NOW) {
          this.setState(prevState => ({
            ...prevState,
            ghostIndex: prevState.ghostIndex + 1
          }));
        }

        this.previousDelta = currentDelta;
      }
    };

    poseDetectionFrameInner();
  };

  async componentDidMount() {
    this.net = await posenet.load(this.props.mobileNetArchitecture);
    //console.log("loaded mobilenet");
    //console.log(this.net);

    try {
      this.camera = await this.setupCamera();
    } catch (e) {
      const e2 =
        "This browser does not support video capture, or this device does not have a camera";
      this.setState({ error_messages: e2 });
      throw e2;
    } finally {
      this.setState({ loading: false });
    }

    this.detectPose();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
      if (prevProps.frontCamera !== this.props.frontCamera) {
        // stop existing camera
        this.stopCamera();
        // setup and start
        this.camera = await this.setupCamera();
        this.startCamera();
        // detect pose
        this.detectPose();
      }
    }

    if (prevState !== this.state) {
      if (prevState.score !== this.state.score && this.state.score !== 0) {
        if (this.timeout) clearTimeout(this.timeout);
        this.setState({ scoreOpacity: 1 });
        this.timeout = setTimeout(
          () => this.setState({ scoreOpacity: 0 }),
          3000
        );
      }
    }
  }

  componentWillUnmount() {
    console.log("component will unmounts!");
    this.stopCamera();
    this.setState({ stop: true });
  }

  render() {
    const loading = this.state.loading ? (
      <div className={styles.loading}>
        <code>{this.props.loadingText}</code>
        <br />
        <code style={{ color: "red", fontSize: 12 }}>
          {this.state.error_messages}
        </code>
      </div>
    ) : (
      ""
    );

    this.errorMessages();

    const Score = () => {
      if (this.state.score !== 0) this.lastScore = this.state.score;

      return (
        <div className={styles.scores}>
          <p className={styles.totalScore}>{this.state.totalScore}</p>
          <p
            className={styles.score}
            style={{
              opacity: this.state.scoreOpacity
            }}
          >
            {this.lastScore}
          </p>
        </div>
      );
    };

    return (
      <div className={styles.posenet}>
        {this.props.compete && <Score />}
        {loading}

        <div
          className={styles.posenetCanvasContainer}
          style={{ width: this.props.videoWidth, overflow: "hidden" }}
        >
          <Webcam ref={this.getVideo} playsInline />
          <canvas className={styles.posenetCanvas} ref={this.getCanvas} />
        </div>
      </div>
    );
  }
}
