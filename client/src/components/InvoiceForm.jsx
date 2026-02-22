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
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [vatRate, setVatRate] = React.useState(0.07);
  const [items, setItems] = React.useState([{ product_code: "", quantity: 1, unit_price: 0 }]);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, title: "Validation Error", message: "" });
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false);
  const [customerDetails, setCustomerDetails] = React.useState(null); // name + address (readonly)
  const [customerLoadError, setCustomerLoadError] = React.useState("");

  // When customer code is set (from LoV or initialData), fetch name and address
  React.useEffect(() => {
    const code = String(customerCode || "").trim();
    if (!code) {
      setCustomerDetails(null);
      setCustomerLoadError("");
      return;
    }
    setCustomerLoadError("");
    let cancelled = false;
    getCustomer(code)
      .then((data) => {
        if (!cancelled) setCustomerDetails(data);
      })
      .catch(() => {
        if (!cancelled) {
          setCustomerDetails(null);
          setCustomerLoadError("Customer not found");
        }
      });
    return () => { cancelled = true; };
  }, [customerCode]);

  // Load customer by code on blur (user typed code)
  const handleCustomerCodeBlur = () => {
    const code = String(customerCode || "").trim();
    if (!code) {
      setCustomerDetails(null);
      setCustomerLoadError("");
      return;
    }
    setCustomerLoadError("");
    getCustomer(code)
      .then((data) => setCustomerDetails(data))
      .catch(() => {
        setCustomerDetails(null);
        setCustomerLoadError("Customer not found");
      });
  };

  React.useEffect(() => {
    if (initialData) {
      setInvoiceNo(initialData.invoice_no);
      setCustomerCode(initialData.customer_code || "");
      const d = initialData.invoice_date ? new Date(initialData.invoice_date).toISOString().slice(0, 10) : "";
      setInvoiceDate(d);
      setVatRate(Number(initialData.vat_rate || 0.07));
      const mappedItems = (initialData.line_items || []).map(li => ({
        line_item_id: li.line_item_id,
        product_code: li.product_code || "",
        product_label: li.product_label || `${li.product_code || ""} - ${li.product_name || ""}`.replace(/^ - /, ""),
        units_code: li.units_code || "",
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
  const hasEmptyCustomer = !String(customerCode || "").trim() || !customerDetails;

  const customerAddressDisplay = customerDetails
    ? [customerDetails.address_line1, customerDetails.address_line2, customerDetails.country_name].filter(Boolean).join(", ") || ""
    : "";

  // Collect all validation errors; return empty array if valid.
  function validate() {
    const errs = [];
    if (!invoiceDate || String(invoiceDate).trim() === "") errs.push("Date should not be null");
    if (!String(customerCode || "").trim()) errs.push("Customer Code should not be null");
    else if (!customerDetails) errs.push("Customer must be selected from list (enter code and blur, or use LoV)");
    if (!initialData && !autoCode && !String(invoiceNo || "").trim()) errs.push("Invoice No should not be null");
    items.forEach((it, i) => {
      const row = i + 1;
      if (!String(it.product_code || "").trim()) errs.push(`Row ${row}: Product is required`);
      else {
        const q = Number(it.quantity);
        if (Number.isNaN(q) || q <= 0) errs.push(`Row ${row}: Product quantity should be a positive number`);
        const p = Number(it.unit_price);
        if (it.unit_price !== "" && it.unit_price != null && (Number.isNaN(p) || p < 0)) errs.push(`Row ${row}: Price should be a positive number`);
      }
    });
    return errs;
  }

  // Build payload and pass to parent
  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      setAlertModal({
        isOpen: true,
        title: "Save Failed.",
        message: (
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-main)" }}>
            {errors.map((msg, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{msg}</li>
            ))}
          </ul>
        ),
      });
      return;
    }
    
    // When editing, always send existing invoice_no so UPDATE does not set it to "" (would violate unique)
    const payload = {
      invoice_no: initialData ? invoiceNo.trim() : (autoCode ? "" : invoiceNo.trim()),
      customer_code: String(customerCode).trim(),
      invoice_date: invoiceDate,
      vat_rate: Number(vatRate),
      line_items: items.map((x) => {
        const out = {
          product_code: String(x.product_code || "").trim(),
          quantity: Number(x.quantity),
          unit_price: x.unit_price === "" || x.unit_price === null ? undefined : Number(x.unit_price),
        };
        if (x.line_item_id != null && Number(x.line_item_id) > 0) out.id = Number(x.line_item_id);
        return out;
      }),
    };
    onSubmit(payload);
  }

  return (
    <>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
      />
      <form onSubmit={handleSubmit} className="invoice-form">
      <div className="invoice-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h4>Invoice Details</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{(!initialData && autoCode) ? "Invoice No" : <>Invoice No <span className="required-marker">*</span></>}</label>
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

            {/* Customer: 3 fields per ticket – code (editable + LoV), name and address (readonly) */}
            <div className="form-group">
              <label className="form-label">Customer Code <span className="required-marker">*</span></label>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <input
                  className="form-control"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  onBlur={handleCustomerCodeBlur}
                  placeholder="e.g. C001"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCustomerModalOpen(true)}
                  title="List of Values"
                >
                  LoV
                </button>
                {customerCode && (
                  <button
                    type="button"
                    onClick={() => { setCustomerCode(""); setCustomerDetails(null); setCustomerLoadError(""); }}
                    title="Clear"
                    style={{
                      padding: "0 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
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
              </div>
              {customerLoadError && (
                <span style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: 4, display: "block" }}>{customerLoadError}</span>
              )}
              {!customerCode && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>Required. Type code and blur, or use LoV to select.</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input className="form-control" disabled value={customerDetails?.name ?? ""} readOnly placeholder="—" />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Address</label>
              <input className="form-control" disabled value={customerAddressDisplay} readOnly placeholder="—" />
            </div>

            <CustomerPickerModal
              isOpen={customerModalOpen}
              onClose={() => setCustomerModalOpen(false)}
              initialSearch={customerCode}
              onSelect={(code) => {
                setCustomerCode(String(code));
                setCustomerModalOpen(false);
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Invoice Date <span className="required-marker">*</span></label>
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
                {hasEmptyCustomer && <div>Please enter customer code or select from LoV</div>}
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
