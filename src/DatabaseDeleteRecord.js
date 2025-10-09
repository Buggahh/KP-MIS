import { db } from "./firebase";
import { doc, deleteDoc, collection, getDocs } from "firebase/firestore";

/**
 * Recursively deletes a document and all specified subcollections.
 * @param {string} path - Full Firestore path to the document.
 * @param {string[]} subcollections - Known subcollection names.
 */
async function deleteRecursively(path, subcollections) {
  const ref = doc(db, ...path.split("/"));

  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, ...path.split("/"), sub));
    for (const d of snap.docs) {
      await deleteRecursively(`${path}/${sub}/${d.id}`, subcollections);
      await deleteDoc(d.ref);
    }
  }

  await deleteDoc(ref);
}

/**
 * Deletes a case and all related subcollections.
 * @param {string} caseId - The case document ID.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function DatabaseDeleteRecord(caseId) {
  if (!caseId) return false;
  try {
    await deleteRecursively(`cases/${caseId}`, [
      "complainant",
      "respondent",
      "caseStatus",
      "caseManagement",
      "compliance"
    ]);
    return true;
  } catch (error) {
    console.error("Error deleting record:", error);
    return false;
  }
}
