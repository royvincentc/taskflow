import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export const AuthService = {
    signUp: async (email: string, pass: string) => {
        return createUserWithEmailAndPassword(auth, email, pass);
    },
    signIn: async (email: string, pass: string) => {
        return signInWithEmailAndPassword(auth, email, pass);
    },
    logout: async () => {
        return signOut(auth);
    },
    subscribeToAuthChanges: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
