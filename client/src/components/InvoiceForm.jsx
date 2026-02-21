// Invoice form (create/edit) with customer select and line items
// Example usage: <InvoiceForm onSubmit={...} />
import React from "react";
import LineItemsEditor from "./LineItemsEditor.jsx";
import CustomerPickerModal from "./CustomerPickerModal.jsx";
import { AlertModal } from "./Modal.jsx";
import { getCustomer } from "../api/customers.api.js";
import { formatBaht } from "../utils.js";

export default function InvoiceForm({ onSubmit, submitting, initialData }) {
  // Local state for header fields and line items
  const [invoiceNo, setInvoiceNo] = React.useState("");
  const [customerCode, setCustomerCode] = React.useState("");
  const [customerLabel, setCustomerLabel] = React.useState(""); // For displaying selected customer
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [vatRate, setVatRate] = React.useState(0.07);
  const [items, setItems] = React.useState([{ product_code: "", quantity: 1, unit_price: 0 }]);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false);
  const [customerDetails, setCustomerDetails] = React.useState(null);

  // When customer is selected (or set from initialData), fetch full details for display
  React.useEffect(() => {
    if (!customerCode) {
      setCustomerDetails(null);
      return;
    }
    let cancelled = false;
    getCustomer(customerCode)
      .then((data) => {
        if (!cancelled) setCustomerDetails(data);
      })
      .catch(() => {
        if (!cancelled) setCustomerDetails(null);
      });
    return () => { cancelled = true; };
  }, [customerCode]);

  React.useEffect(() => {
    if (initialData) {
      setInvoiceNo(initialData.invoice_no);
      setCustomerCode(initialData.customer_code || "");
      setCustomerLabel(initialData.customer_label || "");
      const d = initialData.invoice_date ? new Date(initialData.invoice_date).toISOString().slice(0, 10) : "";
      setInvoiceDate(d);
      setVatRate(Number(initialData.vat_rate || 0.07));
      const mappedItems = (initialData.line_items || []).map(li => ({
        product_code: li.product_code || "",
        product_label: li.product_label || `${li.product_code || ""} - ${li.product_name || ""}`.replace(/^ - /, ""),
        quantity: li.quantity,
        unit_price: Number(li.unit_price)
      }));
      setItems(mappedItems.length > 0 ? mappedItems : [{ product_code: "", quantity: 1, unit_price: 0 }]);
    }
  }, [initialData]);

  const subtotal = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
  const vat = subtotal * Number(vatRate || 0);
  const amountDue = subtotal + vat;

  const [autoCode, setAutoCode] = React.useState(true);

  const hasEmptyProduct = items.some(it => !it.product_code);
  const hasEmptyCustomer = !customerCode;

  // Build payload and pass to parent
  function handleSubmit(e) {
    e.preventDefault();
    
    // Validate: customer must be selected
    if (hasEmptyCustomer) {
      setAlertModal({ isOpen: true, message: 'Please select a customer' });
      return;
    }
    
    // Validate: all items must have a product selected
    if (hasEmptyProduct) {
      setAlertModal({ isOpen: true, message: 'Please select a product for all items' });
      return;
    }
    
    // When editing, always send existing invoice_no so UPDATE does not set it to "" (would violate unique)
    const payload = {
      invoice_no: initialData ? invoiceNo.trim() : (autoCode ? "" : invoiceNo.trim()),
      customer_code: String(customerCode).trim(),
      invoice_date: invoiceDate,
      vat_rate: Number(vatRate),
      line_items: items.map((x) => ({
        product_code: String(x.product_code || "").trim(),
        quantity: Number(x.quantity),
        unit_price: x.unit_price === "" || x.unit_price === null ? undefined : Number(x.unit_price),
      })),
    };
    onSubmit(payload);
  }

  return (
    <>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
        title="Validation Error"
        message={alertModal.message}
      />
      <form onSubmit={handleSubmit} className="invoice-form">
      <div className="invoice-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h4>Invoice Details</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Invoice No</label>
              <div className="flex gap-2">
                <input
                  className="form-control"
                  required={!autoCode}
                  disabled={autoCode}
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-2026-0001"
                />
                {!initialData && (
                  <div className="form-inline-option">
                    <input type="checkbox" checked={autoCode} onChange={e => setAutoCode(e.target.checked)} id="inv_auto" />
                    <label htmlFor="inv_auto">Auto</label>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Customer</label>
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  alignItems: "stretch",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  minHeight: 38,
                }}
              >
                <button
                  type="button"
                  className="customer-select-trigger"
                  onClick={() => setCustomerModalOpen(true)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    background: "var(--bg-surface)",
                    color: customerLabel ? "var(--text-main)" : "var(--text-muted)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {customerLabel || "Select customer..."}
                </button>
                {customerLabel && (
                  <button
                    type="button"
                    onClick={() => { setCustomerCode(""); setCustomerLabel(""); setCustomerDetails(null); }}
                    title="Clear"
                    style={{
                      padding: "0 12px",
                      border: "none",
                      borderLeft: "1px solid var(--border)",
                      background: "var(--bg-body)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: 0, flexShrink: 0 }}
                  onClick={() => setCustomerModalOpen(true)}
                >
                  Select
                </button>
              </div>
              {!customerCode && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Required
                </span>
              )}

              <div className="customer-details-readonly">
                <div className="section-title">Customer Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px" }}>
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <input className="form-control" disabled value={customerDetails?.code ?? ""} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-control" disabled value={customerDetails?.name ?? ""} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-control" disabled value={customerDetails?.country_name ? [customerDetails.country_code, customerDetails.country_name].filter(Boolean).join(" - ") : (customerDetails?.country_code ?? "")} readOnly />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                    <label className="form-label">Address Line 1</label>
                    <input className="form-control" disabled value={customerDetails?.address_line1 ?? ""} readOnly />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                    <label className="form-label">Address Line 2</label>
                    <input className="form-control" disabled value={customerDetails?.address_line2 ?? ""} readOnly />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Credit Limit</label>
                    <input className="form-control" disabled value={customerDetails?.credit_limit != null ? formatBaht(Number(customerDetails.credit_limit)) : ""} readOnly />
                  </div>
                </div>
              </div>

              <CustomerPickerModal
                isOpen={customerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                onSelect={(code, label) => {
                  setCustomerCode(String(code));
                  setCustomerLabel(label);
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">VAT Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="form-control"
                    value={Math.round(Number(vatRate) * 100) / 100}
                    onChange={(e) => setVatRate(e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {(vatRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card invoice-summary-card" style={{ height: "fit-content" }}>
          <h4>Summary</h4>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              <span>Subtotal</span>
              <span className="amount">{submitting ? "..." : formatBaht(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
              <span className="amount">{submitting ? "..." : formatBaht(vat)}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 2, display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>
              <span>Total</span>
              <span>{submitting ? "..." : formatBaht(amountDue)}</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px 14px", fontSize: "0.875rem" }}
              disabled={submitting || hasEmptyProduct || hasEmptyCustomer}
            >
              {submitting ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Create Invoice")}
            </button>
            {(hasEmptyCustomer || hasEmptyProduct) && (
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#ef4444', textAlign: 'center' }}>
                {hasEmptyCustomer && <div>Please select a customer</div>}
                {hasEmptyProduct && <div>Please select a product for all items</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <LineItemsEditor value={items} onChange={setItems} />
    </form>
    </>
  );
}
