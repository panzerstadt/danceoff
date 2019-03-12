import React, { useState, useEffect } from "react";

import styles from "./index.module.css";

import Button from "../Button";

import { PushToFirebase } from "../../lib/firebase";
import { DB_PATH } from "../../lib/constants";

const Submit = ({ score }) => {
  const [username, setUsername] = useState();
  const handleChange = e => {
    setUsername(e.target.value);
  };

  const [userScore, setUserScore] = useState();
  useEffect(() => {
    // fix initial user score on mount
    setUserScore(score);
  }, []);

  const [posted, setPosted] = useState(false);
  useEffect(() => {
    // check if score changed before allowing repost
    if (score !== userScore) {
      setPosted(false);
      setUserScore(score);
    }
  }, [score]);

  const handleSubmit = e => {
    const data = {
      user: username || "anonymous",
      score: score || 0
    };
    // send to firebase
    PushToFirebase(DB_PATH, data, v => console.log(v));
    setPosted(true);
    e.preventDefault();
  };

  const form = (
    <div className={styles.formDiv}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h3>Your score is: {score}</h3>
        <p className={styles.cta}>Enter Your Name</p>
        <input
          className={styles.input}
          type="text"
          onChange={handleChange}
          value={username}
          placeholder="JACK"
        />
        <br />
        <Button theme="default" type="Submit">
          Submit
        </Button>
      </form>
    </div>
  );

  const thanks = (
    <div className={styles.thankYou}>
      <h3>Thanks for Playing!</h3>
      <p>if you want to play again, go back to RECORD and start moving!</p>
    </div>
  );

  return posted ? thanks : form;
};

export default Submit;
