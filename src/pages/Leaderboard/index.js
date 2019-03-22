import React, { useEffect } from "react";
import styles from "./index.module.css";

import Rankings from "../../components/Rankings";
import PostRanking from "../../components/PostRanking";

const Page = ({ score }) => {
  useEffect(() => {
    // didmount
    console.log("mounted this page yo");

    return () => console.log("unmounted this page yo");
  }, []);
  return (
    <div className={styles.page}>
      <Rankings />
      <PostRanking score={score} />
    </div>
  );
};

export default Page;
