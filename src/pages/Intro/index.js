import React, { useEffect } from "react";

import styles from "./index.module.css";

import Button from "../../components/Button";

// assets
import dance from "../../assets/images/danceoff.png";
import baseball from "../../assets/images/baseball.jpg";

const Page = ({ onClick }) => {
  useEffect(() => {
    // didmount
    console.log("mounted this page yo");

    return () => console.log("unmounted this page yo");
  }, []);
  return (
    <div className={styles.page}>
      <span className={styles.heroTitle}>Batterly</span>
      <span className={styles.heroText}>be your baseball hero.</span>
      <img className={styles.hero} src={baseball} alt="baseball!" />
      <Button className={styles.startBtn} theme="intro" onClick={onClick}>
        START
      </Button>
    </div>
  );
};

export default Page;
