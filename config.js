import firebase from 'firebase';
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyAhA0Yr2S0jpwPaST43UI2A5fEynLMYXCA",
    authDomain: "libraryapp-5cf76.firebaseapp.com",
    projectId: "libraryapp-5cf76",
    storageBucket: "libraryapp-5cf76.appspot.com",
    messagingSenderId: "851313763269",
    appId: "1:851313763269:web:93de3d37cf4645eda3a1ac"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore()