import React, { useEffect } from "react";

import styles from "./index.module.css";

// assets
import dance from "../../assets/images/danceoff.png";

const Page = ({ onClick }) => {
  useEffect(() => {
    // didmount
    console.log("mounted this page yo");

    return () => console.log("unmounted this page yo");
  }, []);
  return (
    <div className={styles.page}>
      <img className={styles.hero} src={dance} alt="danceoff!" />
      <button className={styles.startBtn} onClick={onClick}>
        START
      </button>
    </div>
  );
};

export default Page;
