import { db } from "./firebase";
import { doc, updateDoc, setDoc, addDoc, collection } from "firebase/firestore";

// Accepts: caseNumber, editData (with all subcollections as arrays)
export async function updateCaseRecord(caseNumber, editData) {
  const {
    caseIdNumber,
    complainants,
    respondents,
    mediationRows,
    conciliationRows,
    arbitrationRows,
    caseStatusRows,
    ammicableRows,
    ...mainFields
  } = editData;

  // Update main case document
  await updateDoc(doc(db, "cases", caseNumber), mainFields);

  // Complainants
  const complainantColRef = collection(db, "cases", caseNumber, "complainant");
  for (let i = 0; i < complainants.length; i++) {
    const c = complainants[i];
    const complainantDoc = {
      addressSpecific: c.addressSpecific || c.specific || "",
      barangay: c.barangay || "",
      birthDate: c.birthDate || c.birthdate || "",
      cityMunicipality: c.cityMunicipality || c.city || "",
      contactNo: c.contactNo || c.contact || "",
      email: c.email || "",
      extension: c.extension || "",
      firstName: c.firstName || c.firstname || "",
      lastName: c.lastName || c.lastname || "",
      middleName: c.middleName || c.middlename || "",
      province: c.province || "",
      sex: c.sex || ""
    };
    const docId = c.id || `complainantId${i + 1}`;
    await setDoc(doc(complainantColRef, docId), complainantDoc);
  }

  // Respondents
  const respondentColRef = collection(db, "cases", caseNumber, "respondent");
  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i];
    const respondentDoc = {
      addressSpecific: r.addressSpecific || r.specific || "",
      barangay: r.barangay || "",
      birthDate: r.birthDate || r.birthdate || "",
      cityMunicipality: r.cityMunicipality || r.city || "",
      contactNo: r.contactNo || r.contact || "",
      email: r.email || "",
      extension: r.extension || "",
      firstName: r.firstName || r.firstname || "",
      lastName: r.lastName || r.lastname || "",
      middleName: r.middleName || r.middlename || "",
      province: r.province || "",
      sex: r.sex || ""
    };
    const docId = r.id || `respondentId${i + 1}`;
    await setDoc(doc(respondentColRef, docId), respondentDoc);
  }

  // Case Status
  const caseStatusColRef = collection(db, "cases", caseNumber, "caseStatus");
  for (let i = 0; i < caseStatusRows.length; i++) {
    const s = caseStatusRows[i];
    const caseStatusDoc = {
      statusDate: s.statusDate || "",
      status: s.selectedStatus || "",
      repudiated: s.repudiated || "",
      mainPoint: s.mainPoint || "",
      execution: s.execution || "",
      executionDate: s.executionDate || "",
      executionReason: s.executionReason || ""
    };
    const docId = s.id || `caseStatusId${i + 1}`;
    await setDoc(doc(caseStatusColRef, docId), caseStatusDoc);
  }

  // Compliance
  const complianceColRef = collection(db, "cases", caseNumber, "compliance");
  for (let i = 0; i < (ammicableRows?.length || 0); i++) {
    const comp = ammicableRows[i];
    const complianceDoc = {
      date: comp.date || "",
      remarks: comp.remarks || ""
    };
    const docId = comp.id || `complianceId${i + 1}`;
    await setDoc(doc(complianceColRef, docId), complianceDoc);
  }

  // Case Management (arbitration, conciliation, mediation)
  const caseManagementColRef = collection(db, "cases", caseNumber, "caseManagement");

  // Arbitration
  if (arbitrationRows) {
    const arbitrationDocRef = doc(caseManagementColRef, "arbitration");
    const arbitrationFields = {};
    for (let i = 0; i < arbitrationRows.length; i++) {
      arbitrationFields[`arbitrationId${i + 1}`] = arbitrationRows[i];
    }
    await setDoc(arbitrationDocRef, arbitrationFields, { merge: true });
  }

  // Conciliation
  if (conciliationRows) {
    const conciliationDocRef = doc(caseManagementColRef, "conciliation");
    const conciliationFields = {};
    for (let i = 0; i < conciliationRows.length; i++) {
      conciliationFields[`conciliationId${i + 1}`] = conciliationRows[i];
    }
    await setDoc(conciliationDocRef, conciliationFields, { merge: true });
  }

  // Mediation
  if (mediationRows) {
    const mediationDocRef = doc(caseManagementColRef, "mediation");
    const mediationFields = {};
    for (let i = 0; i < mediationRows.length; i++) {
      mediationFields[`mediationId${i + 1}`] = mediationRows[i];
    }
    await setDoc(mediationDocRef, mediationFields, { merge: true });
  }
}