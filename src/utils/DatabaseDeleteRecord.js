import { db } from "../firebase";
import { doc, collection, getDocs, writeBatch } from "firebase/firestore";

/**
 * Recursively collect DocumentReferences for a document and all nested subcollection documents.
 * Uses parallel traversal for faster performance.
 *
 * @param {string} path - Full Firestore path (e.g. "cases/CASEID")
 * @param {string[]} subcollections - Names of known subcollections to traverse
 * @param {Array} outRefs - Array to collect DocumentReference objects
 */
async function collectDocRefs(path, subcollections, outRefs) {
  const parts = path.split("/").filter(Boolean);
  const ref = doc(db, ...parts);

  // Process all subcollections in parallel
  await Promise.all(
    subcollections.map(async (sub) => {
      const colRef = collection(db, ...parts, sub);
      const snap = await getDocs(colRef);

      if (!snap.empty) {
        // Collect children recursively in parallel
        await Promise.all(
          snap.docs.map((d) =>
            collectDocRefs(`${path}/${sub}/${d.id}`, subcollections, outRefs)
          )
        );
      }
    })
  );

  // Add this doc last (delete children first)
  outRefs.push(ref);
}

/**
 * Commits batched deletions (max 500 writes per batch, safe at 400).
 * @param {Array} refs - Array of DocumentReference objects to delete
 */
async function commitBatches(refs) {
  const BATCH_SIZE = 400;
  const total = refs.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const slice = refs.slice(i, i + BATCH_SIZE);
    slice.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/**
 * Deletes a case document and all related subcollection documents in parallel batches.
 *
 * @param {string} caseId - The case document ID (e.g. "CASE123")
 * @returns {Promise<boolean>} True on success, false otherwise.
 */
export async function DatabaseDeleteRecord(caseId) {
  if (!caseId) return false;

  const knownSubcollections = [
    "complainant",
    "respondent",
    "caseStatus",
    "caseManagement",
    "compliance",
  ];

  try {
    const refsToDelete = [];
    await collectDocRefs(`cases/${caseId}`, knownSubcollections, refsToDelete);

    if (refsToDelete.length > 0) {
      await commitBatches(refsToDelete);
    }

    console.log(`✅ Deleted ${refsToDelete.length} documents for case: ${caseId}`);
    return true;
  } catch (err) {
    console.error("❌ DatabaseDeleteRecord error:", err);
    return false;
  }
}
