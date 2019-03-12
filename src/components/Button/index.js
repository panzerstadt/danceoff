import React from "react";

import styles from "./index.module.css";

const Button = ({ children, onClick, theme = "default", ...rest }) => {
  return (
    <button className={styles[theme]} onClick={onClick} {...rest}>
      {children || "button"}
    </button>
  );
};

export default Button;
