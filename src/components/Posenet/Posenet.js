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
import GWARA_GIRL from "./data/GWARA_GIRL_2.json";
const GHOST = GWARA_GIRL.poseRecords;

export default class PoseNetComponent extends Component {
  static defaultProps = {
    videoWidth: 600,
    videoHeight: 500,
    algorithm: "single-pose",
    mobileNetArchitecture: isMobile() ? 0.5 : 1.01,
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
    maxPoseDetections: 10,
    nmsRadius: 20.0,
    outputStride: 16,
    imageScaleFactor: 0.5,
    skeletonColor: "aqua",
    ghostColor: "lightgrey",
    skeletonLineWidth: 2,
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
    time: Date.now()
  };
  camera = undefined;
  timeout = undefined;
  previousDelta = 0;
  lastScore = 0;
  traceVideo = this.traceVideo.bind(this);

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

  errorMessages() {
    // pipe out error messages
    if (this.props.errorMessages) {
      this.props.errorMessages(this.state.error_messages);
    }
  }

  // the traced sequence
  getPoseRecords() {
    if (this.props.getPoseRecords) {
      this.props.getPoseRecords(this.state.trace);
    }
  }

  getVideoRecords() {
    if (this.props.getVideoRecords) {
      this.props.getVideoRecords(this.state.frames);
    }
  }

  tracePose(poses) {
    if (this.props.record) {
      this.setState({ trace: [...this.state.trace, ...poses] });
    }
  }

  traceVideo(blob) {
    if (this.props.record) {
      this.setState({ frames: [...this.state.frames, blob] });
    }
  }

  getCanvas = elem => {
    this.canvas = elem;
  };

  getVideo = elem => {
    this.video = elem;
  };

  stopCamera() {
    const cam = this.camera;
    if (cam) {
      const stream = cam.srcObject;
      const tracks = stream.getTracks();

      // stop all tracks
      tracks.map(t => t.stop());
      this.camera = undefined;
      this.setState({ loading: true, stop: true });
    }
  }

  startCamera() {
    const cam = this.camera;
    if (cam) {
      this.setState({ loading: false, stop: false });
    } else {
      this.stopCamera();
    }
  }

  async setupCamera() {
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

    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: frontCamera ? "user" : { exact: "environment" },
        width: mobile ? void 0 : videoWidth,
        height: mobile ? void 0 : videoHeight
      }
    });

    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        // Once the video metadata is ready, we can start streaming video
        video.play();
        resolve(video); // promise returns video
      };
    });
  }

  detectPose() {
    const { videoWidth, videoHeight } = this.props;
    const canvas = this.canvas;
    const ctx = canvas.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    this.poseDetectionFrame(ctx);
  }

  poseDetectionFrame(ctx) {
    const {
      algorithm,
      imageScaleFactor,
      forceFlipHorizontal,
      outputStride,
      minPoseConfidence,
      maxPoseDetections,
      minPartConfidence,
      nmsRadius,
      videoWidth,
      videoHeight,
      showVideo,
      showPoints,
      showSkeleton,
      skeletonColor,
      ghostColor,
      skeletonLineWidth,
      frontCamera,
      stop,
      maxFPS,
      compete
    } = this.props;

    const net = this.net;
    const video = this.video;
    const flipped = forceFlipHorizontal
      ? forceFlipHorizontal
      : frontCamera
      ? true
      : false;

    const poseDetectionFrameInner = async currentDelta => {
      // this is to cap fps
      //requestAnimationFrame(poseDetectionFrameInner);
      if (!stop) requestAnimationFrame(poseDetectionFrameInner);
      var delta = currentDelta - this.previousDelta;
      if (maxFPS && delta < 1000 / maxFPS) {
        return;
      }

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

      // DRAW GWARA GIRL
      // ---------------
      if (compete) {
        if (!GHOST[this.state.ghostIndex]) {
          // end of loop
          console.log("RESET!!!!");
          const millis = Date.now() - this.state.time;
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
            this.setState({ totalScore: 0, time: Date.now(), stop: true });
          }
        } else {
          const g_keypoints = GHOST[this.state.ghostIndex].keypoints;
          const g_score = GHOST[this.state.ghostIndex].score;

          if (g_score >= minPoseConfidence) {
            if (showPoints) {
              drawKeypoints(g_keypoints, minPartConfidence, ghostColor, ctx);
            }
            if (showSkeleton) {
              drawSkeleton(
                g_keypoints,
                minPartConfidence,
                ghostColor,
                skeletonLineWidth,
                ctx
              );
            }
          }

          // SCORE USER AGAINST GHOST
          const userPose = poses[0];
          const similarity = scoreSimilarity(
            userPose,
            this.state.ghostIndex, // TODO: change this
            GHOST
          );

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
        console.log("stopping function");
        console.log("TODO: FIX MEMORY LEAK");
        // clear canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);
      } else {
        // console.log(poses);

        if (this.props.record) {
          if (this.props.recordVideo) {
            //console.log("recording frame and video!");
          } else {
            //console.log("recording frames!");
          }
          // trace
          this.tracePose(poses);
          // record video
          this.canvas.toBlob(this.traceVideo, "image/jpeg", 0.4);

          // stream poses to parent
          this.getPoseRecords();
          this.getVideoRecords();
        }

        // call next recursion
        this.setState(prevState => ({
          ...prevState,
          ghostIndex: prevState.ghostIndex + 1
        }));

        this.previousDelta = currentDelta;
      }
    };

    poseDetectionFrameInner();
  }

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
        <video playsInline ref={this.getVideo} />
        {/* <Webcam ref={this.getVideo} /> */}
        <canvas ref={this.getCanvas} />
      </div>
    );
  }
}
