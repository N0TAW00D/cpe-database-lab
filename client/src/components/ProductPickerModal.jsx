import React from "react";
import { listProducts } from "../api/products.api.js";
import { formatBaht } from "../utils.js";
import ListPickerModal from "./ListPickerModal.jsx";

const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "units_code", label: "Unit" },
  { key: "unit_price", label: "Unit Price", align: "right", render: (v) => (v != null ? formatBaht(v) : "-") },
];

export default function ProductPickerModal({ isOpen, onClose, onSelect }) {
  const fetchData = React.useCallback((params) => listProducts(params), []);

  return (
    <ListPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      title="Select Product"
      searchPlaceholder="Search code, name..."
      fetchData={fetchData}
      columns={COLUMNS}
      itemName="product"
      emptySearch="No products found."
      emptyDefault="No products yet."
      getSelectLabel={(row) => `${row.code} - ${row.name}`}
    />
  );
}
