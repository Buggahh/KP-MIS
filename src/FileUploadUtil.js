import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads a single file to:
 *   casesDocuments/{caseId}/{type}/{type}_{n}.{ext}
 * (keeps existing uploadFileToCase for single-use compatibility).
 * ...existing uploadFileToCase...
 */
// (keep your existing uploadFileToCase implementation here)

/**
 * Upload multiple files to:
 *   casesDocuments/{caseId}/{type}/
 * If listing is allowed, names become type_1.ext, type_2.ext, ...
 * If listing fails, names fall back to type_{timestamp}_{shortUuid}.ext
 *
 * @param {File[]|FileList} files
 * @param {string} caseId
 * @param {string} type
 * @returns {Promise<Array<{url:string, path:string, name:string}>>}
 */
export async function uploadFilesToCase(files, caseId, type = "file") {
  if (!files || (Array.isArray(files) && files.length === 0) || files.length === 0) {
    throw new Error("No files provided");
  }
  if (!caseId) throw new Error("No caseId provided");
  if (!type) type = "file";

  const fileArray = Array.from(files);
  const storage = getStorage();
  const folderPath = `casesDocuments/${caseId}/${type}`;
  const folderRef = ref(storage, folderPath);

  // Try to list existing files once to determine next index
  let useSequential = true;
  let startingIndex = 1;
  try {
    const listResult = await listAll(folderRef);
    const regex = new RegExp(`^${escapeRegExp(type)}_(\\d+)(?:\\.[^.]*)?$`, "i");
    let max = 0;
    listResult.items.forEach(itemRef => {
      const name = itemRef.name || "";
      const m = name.match(regex);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    startingIndex = max + 1;
  } catch (err) {
    // listing not allowed or folder empty -> fallback to unique names
    useSequential = false;
  }

  const uploadPromises = [];
  if (useSequential) {
    // compute names deterministically and upload (can run in parallel)
    fileArray.forEach((file, idx) => {
      const ext = getExtension(file.name);
      const finalName = `${type}_${startingIndex + idx}${ext}`;
      const fileRef = ref(storage, `${folderPath}/${finalName}`);
      const p = uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef)).then(url => ({
        url,
        path: `${folderPath}/${finalName}`,
        name: finalName
      }));
      uploadPromises.push(p);
    });
  } else {
    // fallback: unique filename per file
    fileArray.forEach(file => {
      const ext = getExtension(file.name);
      const short = uuidv4().split("-")[0];
      const ts = Date.now();
      const finalName = `${type}_${ts}_${short}${ext}`;
      const fileRef = ref(storage, `${folderPath}/${finalName}`);
      const p = uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef)).then(url => ({
        url,
        path: `${folderPath}/${finalName}`,
        name: finalName
      }));
      uploadPromises.push(p);
    });
  }

  // Run uploads in parallel (Promise.all)
  const results = await Promise.all(uploadPromises);
  return results;
}

/* Helpers (keep existing helpers or add if missing) */
function getExtension(filename) {
  if (!filename) return "";
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.substring(idx) : "";
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}