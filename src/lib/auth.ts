
import { auth } from './firebase';
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, User, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        return null;
    }
}

export const signInWithGitHub = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with GitHub: ", error);
        return null;
    }
}

export const signInAnonymously = async (): Promise<User | null> => {
    try {
        const result = await firebaseSignInAnonymously(auth);
        return result.user;
    } catch (error) {
        console.error("Error signing in anonymously: ", error);
        return null;
    }
}

export const signOut = async (): Promise<void> => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out: ", error);
    }
}

export { auth };
