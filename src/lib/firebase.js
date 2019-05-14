import firebase from "firebase";

const config = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId
};

// firebase console is under tliqundev@gmail.com

const reactConfig = {};
Object.keys(config).map(v => {
  reactConfig[v] = process.env[`REACT_APP_${v}`];
});

if (!firebase.apps.length) {
  firebase.initializeApp(reactConfig);
}

export default firebase;
//module.exports = firebase;

export const ReadFromFirebase = (databaseRef = "danceoff", callback) => {
  return firebase
    .database()
    .ref(databaseRef)
    .on("value", snapshot => {
      const vals = snapshot.val();
      callback(vals);
    });
};

export const ReadSortedFromFirebase = (
  databaseRef = "danceoff",
  sortKey = "score",
  limit = 50,
  callback
) => {
  return firebase
    .database()
    .ref(databaseRef)
    .orderByChild(sortKey)
    .limitToLast(limit)
    .on("value", snapshot => {
      const sortedVals = [];
      snapshot.forEach(child => {
        sortedVals.push(child.val());
      });

      callback(sortedVals.reverse());
    });
};

export const PushToFirebase = (databaseRef = "danceoff", data, callback) => {
  firebase
    .database()
    .ref(databaseRef)
    .push(data)
    .then(v => callback(v));
};
