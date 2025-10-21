import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export function useDatabaseSearch(refreshKey = 0) {
  const [year, setYear] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [extension, setExtension] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const casesSnapshot = await getDocs(collection(db, "cases"));
        setTotalRecords(casesSnapshot.size);

        let casesData = [];
        await Promise.all(
          casesSnapshot.docs.map(async caseDoc => {
            const caseId = caseDoc.id;
            const caseData = caseDoc.data();

            // Get year from dateTimeFiled
            let filedYear = "";
            if (typeof caseData.dateTimeFiled === "string") {
              filedYear = caseData.dateTimeFiled.slice(0, 4);
            }

            // Get latest status from caseStatus subcollection
            let latestStatus = "";
            const caseStatusRef = collection(db, "cases", caseId, "caseStatus");
            const statusSnapshot = await getDocs(caseStatusRef);
            if (!statusSnapshot.empty) {
              const sortedStatuses = statusSnapshot.docs
                .map(s => ({ id: s.id, ...s.data() }))
                .sort((a, b) => a.id.localeCompare(b.id));
              const latest = sortedStatuses[sortedStatuses.length - 1];
              latestStatus = latest?.status || "";
            }

            // Fetch complainants from subcollection
            const complainantSnapshot = await getDocs(collection(db, "cases", caseId, "complainant"));
            complainantSnapshot.forEach(doc => {
              const person = doc.data();
              casesData.push({
                caseNumber: caseId,
                year: filedYear,
                nature: caseData.natureOfComplaint || "",
                offense: caseData.offenseViolation || "",
                status: latestStatus,
                date: caseData.dateOfIncident || "",
                lastname: person.lastName || "",
                firstname: person.firstName || "",
                middlename: person.middleName || "",
                extension: person.extension || "",
                name: [
                  person.lastName,
                  person.firstName,
                  person.middleName,
                  person.extension
                ].filter(Boolean).join(", ").replace(", ,", ",").replace(" ,", " "),
                party: "Complainant",
                tag: caseData.tag || "",
              });
            });

            // Fetch respondents from subcollection
            const respondentSnapshot = await getDocs(collection(db, "cases", caseId, "respondent"));
            respondentSnapshot.forEach(doc => {
              const person = doc.data();
              casesData.push({
                caseNumber: caseId,
                year: filedYear,
                nature: caseData.natureOfComplaint || "",
                offense: caseData.offenseViolation || "",
                status: latestStatus,
                date: caseData.dateOfIncident || "",
                lastname: person.lastName || "",
                firstname: person.firstName || "",
                middlename: person.middleName || "",
                extension: person.extension || "",
                name: [
                  person.lastName,
                  person.firstName,
                  person.middleName,
                  person.extension
                ].filter(Boolean).join(", ").replace(", ,", ",").replace(" ,", " "),
                party: "Respondent",
                tag: caseData.tag || "",
              });
            });
          })
        );
        setRows(casesData);
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
      setLoading(false);
    }
    fetchCases();
  }, [refreshKey]);

  // Filter rows by year, case number, and name parts
  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (year.trim()) {
      const q = year.trim();
      filtered = filtered.filter(row => String(row.year || "").includes(q));
    }
    if (caseNumber.trim()) {
      filtered = filtered.filter(row => row.caseNumber.includes(caseNumber.trim()));
    }
    if (lastname.trim()) {
      filtered = filtered.filter(row =>
        row.lastname.toLowerCase().includes(lastname.trim().toLowerCase())
      );
    }
    if (firstname.trim()) {
      filtered = filtered.filter(row =>
        row.firstname.toLowerCase().includes(firstname.trim().toLowerCase())
      );
    }
    if (middlename.trim()) {
      filtered = filtered.filter(row =>
        row.middlename.toLowerCase().includes(middlename.trim().toLowerCase())
      );
    }
    if (extension.trim()) {
      filtered = filtered.filter(row =>
        row.extension.toLowerCase().includes(extension.trim().toLowerCase())
      );
    }
    return filtered;
  }, [rows, year, caseNumber, lastname, firstname, middlename, extension]);

  return {
    year,
    setYear,
    caseNumber,
    setCaseNumber,
    lastname,
    setLastname,
    firstname,
    setFirstname,
    middlename,
    setMiddlename,
    extension,
    setExtension,
    filteredRows,
    loading,
    totalRecords,
  };
}