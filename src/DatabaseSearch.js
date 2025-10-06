import { useState, useMemo } from "react";

export function DatabaseSearch(rows) {
  const [year, setYear] = useState("");

  // Filter rows by year (if year is not empty)
  const filteredRows = useMemo(() => {
    if (!year.trim()) return rows;
    return rows.filter(row => row.year && row.year.includes(year.trim()));
  }, [rows, year]);

  return {
    year,
    setYear,
    filteredRows,
  };
}