import React from "react";
import { listCustomers } from "../api/customers.api.js";
import { formatBaht } from "../utils.js";
import ListPickerModal from "./ListPickerModal.jsx";

const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  {
    key: "address_line1",
    label: "Address",
    render: (_, row) => [row.address_line1, row.address_line2].filter(Boolean).join(", ") || "-",
  },
  { key: "credit_limit", label: "Credit Limit", align: "right", render: (v) => (v != null ? formatBaht(v) : "-") },
];

export default function CustomerPickerModal({ isOpen, onClose, onSelect }) {
  const fetchData = React.useCallback((params) => listCustomers(params), []);

  const handleSelect = React.useCallback(
    (row) => {
      const label = `${row.code} - ${row.name}`;
      onSelect(row.code, label);
    },
    [onSelect]
  );

  return (
    <ListPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
      title="Select Customer"
      searchPlaceholder="Search code, name, address..."
      fetchData={fetchData}
      columns={COLUMNS}
      itemName="customer"
      emptySearch="No customers found."
      emptyDefault="No customers yet."
      getSelectLabel={(row) => `${row.code} - ${row.name}`}
    />
  );
}
