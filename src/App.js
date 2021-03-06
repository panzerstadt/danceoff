import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import styles from "./App.module.css";

// Navigation
import Navigation from "./components/Navigation";

// intro
import Intro from "./pages/Intro";
// watch
import Learn from "./pages/Learn";
// record
import Record from "./pages/Record";
// leaderboard
import Leaderboard from "./pages/Leaderboard";

const App = () => {
  const [page, setPage] = useState("record");
  const [score, setScore] = useState(0);

  const handleScore = score => {
    setScore(score);
    setPage("compete");
  };

  const handleRestart = () => {
    setPage("watch"); // TODO: a separate ready page
    setTimeout(() => setPage("record"), 300);
  };

  const NavRoute = ({ page }) => {
    switch (page) {
      case "home":
        return <Intro onClick={() => setPage("watch")} />;
      case "watch":
        return <Learn />;
      case "record":
        return <Record onScore={handleScore} onRestart={handleRestart} />;
      case "compete":
        return <Leaderboard score={score} />;
      default:
        return <Intro />;
    }
  };
  return (
    <div className={styles.app}>
      <NavRoute page={page} />
      {page !== "home" ? <Navigation onClick={setPage} /> : ""}
    </div>
  );
};

export default App;
