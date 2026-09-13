// lib/auth.js
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut as firebaseSignOut,
    onIdTokenChanged,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { auth, authPersistenceReady } from "./firebase";

async function waitForAuthPersistence() {
    await authPersistenceReady;
}

function mapFirebaseError(err) {
    const map = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/invalid-email": "That email address looks invalid.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Invalid email or password.",
        "auth/email-already-in-use": "An account with that email already exists.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/popup-closed-by-user": "Sign-in was cancelled.",
        "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
        "auth/account-exists-with-different-credential":
            "An account already exists with this email using a different sign-in method.",
    };
    return map[err.code] || err.message || "Something went wrong.";
}

export async function loginWithPassword(email, password) {
    try {
        await waitForAuthPersistence();
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();
        return { user: cred.user, idToken };
    } catch (err) {
        throw new Error(mapFirebaseError(err));
    }
}

export async function createAccount({ first_name, last_name, email, password }) {
    try {
        await waitForAuthPersistence();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fullName = [first_name, last_name].filter(Boolean).join(" ");
        if (fullName) {
            await updateProfile(cred.user, { displayName: fullName });
        }
        const idToken = await cred.user.getIdToken();
        return { user: cred.user, idToken };
    } catch (err) {
        throw new Error(mapFirebaseError(err));
    }
}

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
    try {
        await waitForAuthPersistence();
        const cred = await signInWithPopup(auth, googleProvider);
        const idToken = await cred.user.getIdToken();
        return { user: cred.user, idToken };
    } catch (err) {
        throw new Error(mapFirebaseError(err));
    }
}

export async function requestPasswordReset(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err) {
        throw new Error(mapFirebaseError(err));
    }
}

export function signOut() {
    return firebaseSignOut(auth);
}

export function subscribeToAuthChanges(callback) {
    return onIdTokenChanged(auth, callback);
}

export function getCurrentIdToken(forceRefresh = false) {
    if (!auth.currentUser) return Promise.resolve(null);
    return auth.currentUser.getIdToken(forceRefresh);
}