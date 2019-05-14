const generateScoreTimer = props => {
  const def = {
    totalSecs: (props && props.totalSecs) || 10,
    beatsPerLoop: (props && props.beatsPerLoop) || 4,
    loopSec: (props && props.loopSec) || 2.6,
    pattern: (props && props.pattern) || [1, 3]
  };

  console.log(def);

  const beatUnit = def.loopSec / def.beatsPerLoop;
  const total = def.totalSecs;
  let peaks = [...def.pattern];
  let scoreTimeStamp = [];

  let beat = 0;
  for (let secs = 0; secs < total; secs = secs + beatUnit) {
    // if count is more than beats, reset to 0
    if (beat === def.beatsPerLoop) beat = 0;
    // if pattern ends, repeat pattern
    if (peaks.length === 0) {
      peaks = [...def.pattern];
    }

    // for every beat, evaluate whether is is pattern
    const chk = peaks[0];
    if (chk === beat) {
      scoreTimeStamp.push(secs);

      peaks.shift(); // take out used item
    }

    // if it matches first item in PATTERN, array.shift() it out of the template
    // https://sdras.github.io/array-explorer/
    // and send a callback to score the user
    // TODO: this is also where you place the images to perform pose comparison
    // console.log("beat: ", beat);
    // console.log("time: ", secs);
    // console.log("");
    beat++;
  }

  console.log("SCORING HEURISTIC");
  console.log(scoreTimeStamp);
  return scoreTimeStamp;
};

generateScoreTimer.defaultProps = {
  totalSecs: 10,
  beatsPerLoop: 4,
  loopSec: 2.6,
  pattern: [1, 3]
};

export default generateScoreTimer;
