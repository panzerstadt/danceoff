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
  const [page, setPage] = useState("home");

  const NavRoute = ({ page }) => {
    switch (page) {
      case "home":
        return <Intro onClick={() => setPage("watch")} />;
      case "watch":
        return <Learn />;
      case "record":
        return <Record />;
      case "compete":
        return <Leaderboard />;
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
