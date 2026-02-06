import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import app from "@/lib/firebase";

export const auth = getAuth(app);

/* ── Allowed staff emails ── */
const ALLOWED_EMAILS = [
  "nook@gmail.com",
];

/* ── Sign in with email & password (restricted to allowed emails) ── */
export async function signIn(email: string, password: string) {
  /* Check whitelist before even attempting auth */
  if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
    throw { code: "auth/unauthorized", message: "This account is not authorized." };
  }

  const result = await signInWithEmailAndPassword(auth, email, password);

  /* Double-check after auth in case email casing differs */
  if (!ALLOWED_EMAILS.includes(result.user.email?.toLowerCase().trim() ?? "")) {
    await firebaseSignOut(auth);
    throw { code: "auth/unauthorized", message: "This account is not authorized." };
  }

  return result;
}

/* ── Sign out ── */
export async function signOut() {
  return firebaseSignOut(auth);
}