import { db } from "../firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

/**
 * Submits a new case to Firestore "cases" collection with a numeric document name,
 * and adds all complainants, respondents, case status, compliance, and case management entries as subcollections.
 * @param {Object} complainantSection - The inputs from the Complainant section.
 * @param {Array<Object>} complainants - Array of complainant info objects.
 * @param {Array<Object>} respondents - Array of respondent info objects.
 * @param {Array<Object>} caseStatusRows - Array of case status objects.
 * @param {Array<Object>} ammicableRows - Array of compliance objects.
 * @param {Object} proceedings - Object containing arbitrationRows, conciliationRows, mediationRows.
 * @param {string} caseIdNumber - The case document ID to be used (optional).
 * @returns {Promise<string>} - The new case document ID (number as string).
 */
export async function submitNewCase(
  complainantSection,
  complainants,
  respondents,
  caseStatusRows,
  ammicableRows,
  proceedings,
  caseIdNumber // <-- add this
) {
  // Use the provided caseIdNumber as the document ID
  const caseDocId = caseIdNumber && caseIdNumber.trim() !== "" ? caseIdNumber : `caseId${Date.now()}`;
  const caseDocRef = doc(collection(db, "cases"), caseDocId);

  await setDoc(caseDocRef, {
    ...complainantSection,
    createdAt: new Date().toISOString()
  });

  // Add complainants under cases/<caseDocId>/complainant/complainantIdN
  const complainantColRef = collection(db, "cases", caseDocId, "complainant");
  for (let i = 0; i < complainants.length; i++) {
    const c = complainants[i];
    const complainantDoc = {
      addressSpecific: c.specific || "",
      barangay: c.barangay || "",
      birthDate: c.birthdate || "",
      cityMunicipality: c.city || "",
      contactNo: c.contact || "",
      email: c.email || "",
      extension: c.extension || "",
      firstName: c.firstname || "",
      lastName: c.lastname || "",
      middleName: c.middlename || "",
      province: c.province || "",
      sex: c.sex || ""
    };
    await setDoc(doc(complainantColRef, `complainantId${i + 1}`), complainantDoc);
  }

  // Add respondents under cases/<caseDocId>/respondent/respondentIdN
  const respondentColRef = collection(db, "cases", caseDocId, "respondent");
  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i];
    const respondentDoc = {
      addressSpecific: r.specific || "",
      barangay: r.barangay || "",
      birthDate: r.birthdate || "",
      cityMunicipality: r.city || "",
      contactNo: r.contact || "",
      email: r.email || "",
      extension: r.extension || "",
      firstName: r.firstname || "",
      lastName: r.lastname || "",
      middleName: r.middlename || "",
      province: r.province || "",
      sex: r.sex || ""
    };
    await setDoc(doc(respondentColRef, `respondentId${i + 1}`), respondentDoc);
  }

  // Add case status under cases/<caseDocId>/caseStatus/caseStatusIdN
  const caseStatusColRef = collection(db, "cases", caseDocId, "caseStatus");
  const statusArray = Array.isArray(caseStatusRows) ? caseStatusRows : [caseStatusRows];
  for (let i = 0; i < statusArray.length; i++) {
    const s = statusArray[i];
    const caseStatusDoc = {
      statusDate: s?.statusDate || "",
      status: s?.selectedStatus || "",
      repudiated: s?.repudiated || "",
      mainPoint: s?.mainPoint || "",
      execution: s?.execution || "",
      executionDate: s?.executionDate || "",
      executionReason: s?.executionReason || ""
    };
    await setDoc(doc(caseStatusColRef, `caseStatusId${i + 1}`), caseStatusDoc);
  }

  // Add compliance under cases/<caseDocId>/compliance/complianceIdN
  const complianceColRef = collection(db, "cases", caseDocId, "compliance");
  for (let i = 0; i < (ammicableRows?.length || 0); i++) {
    const comp = ammicableRows[i];
    const complianceDoc = {
      date: comp?.date || "",
      remarks: comp?.remarks || ""
    };
    await setDoc(doc(complianceColRef, `complianceId${i + 1}`), complianceDoc);
  }

  // Add caseManagement under cases/<caseDocId>/caseManagement
  const caseManagementColRef = collection(db, "cases", caseDocId, "caseManagement");

  // Arbitration
  if (proceedings?.arbitrationRows) {
    const arbitrationDocRef = doc(caseManagementColRef, "arbitration");
    const arbitrationFields = {};
    for (let i = 0; i < proceedings.arbitrationRows.length; i++) {
      arbitrationFields[`arbitrationId${i + 1}`] = proceedings.arbitrationRows[i];
    }
    await setDoc(arbitrationDocRef, arbitrationFields);
  }

  // Conciliation
  if (proceedings?.conciliationRows) {
    const conciliationDocRef = doc(caseManagementColRef, "conciliation");
    const conciliationFields = {};
    for (let i = 0; i < proceedings.conciliationRows.length; i++) {
      conciliationFields[`conciliationId${i + 1}`] = proceedings.conciliationRows[i];
    }
    await setDoc(conciliationDocRef, conciliationFields);
  }

  // Mediation
  if (proceedings?.mediationRows) {
    const mediationDocRef = doc(caseManagementColRef, "mediation");
    const mediationFields = {};
    for (let i = 0; i < proceedings.mediationRows.length; i++) {
      mediationFields[`mediationId${i + 1}`] = proceedings.mediationRows[i];
    }
    await setDoc(mediationDocRef, mediationFields);
  }

  return caseDocId;
}