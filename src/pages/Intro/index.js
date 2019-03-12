import React, { useEffect } from "react";

import styles from "./index.module.css";

import Button from "../../components/Button";

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
      <Button theme="intro" onClick={onClick}>
        START
      </Button>
    </div>
  );
};

export default Page;
