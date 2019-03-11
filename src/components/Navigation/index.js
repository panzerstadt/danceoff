import React from "react";

import styles from "./index.module.css";

import Buttons from "./Buttons";

const Page = ({ onClick }) => {
  return (
    <div className={styles.nav}>
      <Buttons onToggle={onClick} />
    </div>
  );
};

export default Page;
