import React, { useEffect } from "react";

import styles from "./Buttons.module.css";
// constants
import { COLORS } from "../../lib/constants";

const ModeButtons = ({
  recordings = [],
  onToggle = v => console.log("toggled! " + v)
}) => {
  const hasRecording = recordings.length === 0;
  return (
    <div className={styles.modeButtons}>
      <div className={styles.btnContainer}>
        <button
          className={
            styles.btnLeft +
            " " +
            (hasRecording ? styles.hasRecordingSecondary : "")
          }
          onClick={() => onToggle("watch")}
          style={{
            padding: "8px 15px"
          }}
        >
          WATCH ▶️
        </button>
        <button
          className={
            styles.btn + " " + (!hasRecording ? styles.hasRecordingMain : "")
          }
          onClick={() => onToggle("record")}
          style={{
            padding: "8px 15px"
          }}
        >
          RECORD 📹
        </button>
        <button
          className={
            styles.btnRight +
            " " +
            (!hasRecording ? styles.hasRecordingMain : "")
          }
          onClick={() => onToggle("compete")}
          style={{
            padding: "8px 15px"
          }}
        >
          COMPETE ⚔️
        </button>
      </div>
    </div>
  );
};

const Page = props => {
  useEffect(() => {
    // didmount
    console.log("mounted this navigation page yo");

    return () => console.log("unmounted this navigation page yo");
  }, []);
  return <ModeButtons {...props} />;
};

export default Page;
