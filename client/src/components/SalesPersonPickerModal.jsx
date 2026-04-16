import React from "react";
import { listSalesPersons } from "../api/sales_persons.api.js";
import ListPickerModal from "./ListPickerModal.jsx";

const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "start_work_date", label: "Start Date" },
];

export default function SalesPersonPickerModal({ isOpen, onClose, onSelect, initialSearch = "" }) {
  const fetchData = React.useCallback((params) => listSalesPersons(params), []);

  const handleSelect = React.useCallback(
    (row) => {
      onSelect(row.code, row.name);
    },
    [onSelect]
  );

  return (
    <ListPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
      initialSearch={initialSearch}
      title="Select Sales Person"
      searchPlaceholder="Search code, name..."
      fetchData={fetchData}
      columns={COLUMNS}
      itemName="sales person"
      emptySearch="No sales persons found."
      emptyDefault="No sales persons yet."
      getSelectLabel={(row) => `${row.code} - ${row.name}`}
    />
  );
}
