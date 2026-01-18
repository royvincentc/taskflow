import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyDIt4N8PLs6OF_kir8JgJuhSXAHn_M5wiA",
    authDomain: "hospital-reminder-app-v1-dev.firebaseapp.com",
    projectId: "hospital-reminder-app-v1-dev",
    storageBucket: "hospital-reminder-app-v1-dev.firebasestorage.app",
    messagingSenderId: "264746204690",
    appId: "1:264746204690:android:ad0b634edec6b9402462cb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };

