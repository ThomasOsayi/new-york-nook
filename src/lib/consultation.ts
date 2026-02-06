import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface ConsultationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  budget: string;
  packageInterest: string;
  message: string;
}

/**
 * Save a consultation request to Firestore.
 * Returns the generated document ID and a reference number.
 */
export async function createConsultation(data: ConsultationData) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  const referenceNumber = `NYN-C-${mm}${dd}-${rand}`;

  const docRef = await addDoc(collection(db, "consultations"), {
    ...data,
    referenceNumber,
    status: "new",
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, referenceNumber };
}