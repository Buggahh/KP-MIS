import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file to upload.
 * @param {string} folder - The folder in storage (e.g., 'complaintSheets').
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export async function uploadFile(file, folder) {
  if (!file) throw new Error("No file provided");
  const storage = getStorage();
  const fileRef = ref(storage, `${folder}/${uuidv4()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}