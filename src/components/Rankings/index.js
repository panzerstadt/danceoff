import React, { useEffect, useState } from "react";

import styles from "./index.module.css";

import { ReadSortedFromFirebase } from "../../lib/firebase";
import { DB_PATH } from "../../lib/constants";

const Rankings = () => {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // mount db listener
    ReadSortedFromFirebase(DB_PATH, "score", 30, setRankings);
  }, []);

  const ListRankings = () => {
    const keys = Object.keys(rankings);
    console.log("List nrakings");
    console.log(keys);

    if (keys.length === 0) return <p>no data.</p>;

    return (
      <ol className={styles.rankingOL}>
        {keys.map((k, i) => (
          <li className={styles.rankingLI} key={i}>
            <p>{rankings[k].user}</p>
            <p>{rankings[k].score}</p>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <>
      <h1 className={styles.title}>Leaderboard</h1>
      <div className={styles.rankings}>
        <ListRankings />
      </div>
    </>
  );
};

export default Rankings;
