import { db } from "./firebase";
import { doc, deleteDoc } from "firebase/firestore";

/**
 * Deletes a case record from Firestore based on the caseId.
 * @param {string} caseId - The document ID to delete.
 * @returns {Promise<boolean>} - Returns true if deleted, false otherwise.
 */
export async function DatabaseDeleteRecord(caseId) {
  if (!caseId) return false;
  try {
    await deleteDoc(doc(db, "cases", caseId));
    return true;
  } catch (error) {
    console.error("Error deleting record:", error);
    return false;
  }
}