import React, { useEffect, useState } from "react";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";

/**
 * ShowUploadedFile
 * Props:
 *  - caseNumber: string (required) -- the case id folder under casesDocuments
 *  - className?: string (optional) to apply to the container
 *
 * This component lists the files under:
 *   casesDocuments/{caseNumber}/complaintSheet
 *   casesDocuments/{caseNumber}/ammicableSettlement
 *   casesDocuments/{caseNumber}/certificateToFileAction
 *   casesDocuments/{caseNumber}/photo
 *
 * It renders the same UI as before: label + clickable filenames (itemRef.name).
 */
export default function ShowUploadedFile({ caseNumber, className }) {
  const [storageUploads, setStorageUploads] = useState({
    complaintSheet: [],
    amicableSettlement: [],
    certificateToFileAction: [],
    photo: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseNumber) {
      setStorageUploads({
        complaintSheet: [],
        amicableSettlement: [],
        certificateToFileAction: [],
        photo: []
      });
      return;
    }

    const storage = getStorage();
    const typeMap = {
      complaintSheet: "complaintSheet",
      amicableSettlement: "ammicableSettlement",
      certificateToFileAction: "certificateToFileAction",
      photo: "photo"
    };

    let cancelled = false;
    setLoading(true);

    async function fetchStorageLists() {
      const result = {};
      await Promise.all(
        Object.entries(typeMap).map(async ([key, folderName]) => {
          const folderPath = `casesDocuments/${caseNumber}/${folderName}`;
          const folder = storageRef(storage, folderPath);
          try {
            const listResult = await listAll(folder);
            const items = await Promise.all(
              listResult.items.map(async (itemRef) => {
                try {
                  const url = await getDownloadURL(itemRef);
                  const name = itemRef.name || "";
                  return { name, url, path: itemRef.fullPath || `${folderPath}/${name}` };
                } catch (err) {
                  // getDownloadURL can fail if permissions block read; skip that item
                  console.error("getDownloadURL failed for", itemRef.fullPath || itemRef.name, err);
                  return null;
                }
              })
            );
            result[key] = items.filter(Boolean);
          } catch (err) {
            // listAll may fail if folder doesn't exist or rules block list
            console.warn("listAll failed for", folderPath, err);
            result[key] = [];
          }
        })
      );
      if (!cancelled) {
        setStorageUploads(prev => ({ ...prev, ...result }));
        setLoading(false);
      }
    }

    fetchStorageLists();

    return () => {
      cancelled = true;
    };
  }, [caseNumber]);

  // Helper to render a list of anchors for a given array
  const renderLinks = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr.map((f, i) => (
      <a
        key={i}
        href={f.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginLeft: 8, marginRight: 8 }}
        title={f.path}
      >
        {f.name}
      </a>
    ));
  };

  return (
    <div className={className || ""}>
      <div className="newrecord-main-content" style={{ marginBottom: "70px" }}>
        <h1 style={{ color: "red" }}>Uploads</h1>
        {loading && <div style={{ marginBottom: 8, color: "#666" }}>Loading uploads...</div>}
        <ul className="uploads-list" style={{ listStyle: "none", paddingLeft: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Complaint Sheet:</strong>
            {renderLinks(storageUploads.complaintSheet) || <span style={{ marginLeft: 8 }} />}
          </li>

          <li style={{ marginBottom: 6 }}>
            <strong>Amicable Settlement:</strong>
            {renderLinks(storageUploads.amicableSettlement) || <span style={{ marginLeft: 8 }} />}
          </li>

          <li style={{ marginBottom: 6 }}>
            <strong>Certificate to File Action:</strong>
            {renderLinks(storageUploads.certificateToFileAction) || <span style={{ marginLeft: 8 }} />}
          </li>

          <li style={{ marginBottom: 6 }}>
            <strong>Photo:</strong>
            {renderLinks(storageUploads.photo) || <span style={{ marginLeft: 8 }} />}
          </li>
        </ul>
      </div>
    </div>
  );
}