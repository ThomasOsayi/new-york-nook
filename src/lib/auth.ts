import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import app from "@/lib/firebase";

export const auth = getAuth(app);

/* ── Sign in with email & password ── */
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/* ── Sign out ── */
export async function signOut() {
  return firebaseSignOut(auth);
}