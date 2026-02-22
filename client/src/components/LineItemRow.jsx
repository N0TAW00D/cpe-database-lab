// Single row in the line items table: product code, name, qty, unit price, reorder/remove buttons
import React from "react";
import { formatBaht } from "../utils.js";

const actionBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  borderRadius: 4,
  color: "#666",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const disabledBtnStyle = { ...actionBtnStyle, cursor: "not-allowed", color: "#ddd" };

const DragIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);
const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);
const ArrowDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function LineItemRow({
  index,
  item,
  itemsLength,
  update,
  removeRow,
  moveUp,
  moveDown,
  insertRowAfter,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  productErrorRow,
  setProductErrorRow,
  onPickProduct,
  onOpenPicker,
  onProductCodeBlur,
  formatBaht,
  computeExtended,
}) {
  const i = index;
  const it = item;
  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, i)}
      onDragOver={(e) => onDragOver(e, i)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, i)}
      onDragEnd={onDragEnd}
      style={{
        opacity: isDragging ? 0.5 : 1,
        background: isDragOver ? "var(--primary-light, #e0f2fe)" : "transparent",
        transition: "background 0.15s, opacity 0.15s",
        cursor: "grab",
      }}
    >
      <td className="text-center">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--text-muted)" }}>
          <span style={{ cursor: "grab", color: "#aaa" }} title="Drag to reorder">
            <DragIcon />
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)", minWidth: 20 }}>{i + 1}</span>
        </div>
      </td>
      <td>
        <div>
          <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
            <input
              type="text"
              className="form-control"
              value={it.product_code || ""}
              onChange={(e) => {
                update(i, { product_code: e.target.value });
                if (productErrorRow === i) setProductErrorRow(null);
              }}
              onBlur={() => onProductCodeBlur(i)}
              placeholder="e.g. P001"
              style={{ flex: 1, minWidth: 0, padding: "6px 10px", fontSize: "0.9rem", borderColor: productErrorRow === i ? "#ef4444" : undefined }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.8rem" }}
              onClick={() => onOpenPicker(i)}
              title="List of Values"
            >
              LoV
            </button>
            {it.product_code && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPickProduct(i, "", null);
                  setProductErrorRow(null);
                }}
                title="Clear"
                style={{
                  padding: "0 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-body)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          {productErrorRow === i && (
            <span style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4, display: "block" }}>Product not found</span>
          )}
        </div>
      </td>
      <td>
        <input
          type="text"
          className="form-control"
          disabled
          readOnly
          value={it.product_name ?? it.product_label?.replace(/^[^\-]+\s*-\s*/, "") ?? ""}
          placeholder="—"
          style={{ padding: "6px 10px", fontSize: "0.9rem", background: "var(--bg-body)" }}
        />
      </td>
      <td className="text-center">
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            background: "var(--bg-body)",
            borderRadius: 4,
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          {it.units_code || "-"}
        </span>
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={it.quantity}
          onChange={(e) => update(i, { quantity: e.target.value })}
          className="form-control"
          style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.9rem" }}
        />
      </td>
      <td>
        <div
          style={{
            textAlign: "right",
            padding: "8px 12px",
            background: "var(--bg-body)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          {formatBaht(it.unit_price)}
        </div>
      </td>
      <td>
        <div style={{ textAlign: "right", fontWeight: 600, color: "var(--primary)", fontSize: "0.95rem" }}>
          {formatBaht(computeExtended(it))}
        </div>
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <button type="button" onClick={() => moveUp(i)} disabled={i === 0} style={i === 0 ? disabledBtnStyle : actionBtnStyle} title="Move up">
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            onClick={() => moveDown(i)}
            disabled={i === itemsLength - 1}
            style={i === itemsLength - 1 ? disabledBtnStyle : actionBtnStyle}
            title="Move down"
          >
            <ArrowDownIcon />
          </button>
          <button type="button" onClick={() => insertRowAfter(i)} style={actionBtnStyle} title="Insert row below">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={itemsLength <= 1}
            style={{
              ...actionBtnStyle,
              color: itemsLength <= 1 ? "#ddd" : "#ef4444",
              cursor: itemsLength <= 1 ? "not-allowed" : "pointer",
            }}
            title="Remove item"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
