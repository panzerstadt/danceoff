import React, { useEffect } from "react";
import styles from "./index.module.css";
const Page = () => {
  useEffect(() => {
    // didmount
    console.log("mounted this page yo");

    return () => console.log("unmounted this page yo");
  }, []);
  return (
    <div className={styles.page}>
      <p>hey yo Record</p>
    </div>
  );
};

export default Page;
