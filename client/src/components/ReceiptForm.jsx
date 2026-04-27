// Receipt form: select customer, choose unpaid invoices, enter payment amounts.
import React from "react";
import CustomerPickerModal from "./CustomerPickerModal.jsx";
import { AlertModal } from "./Modal.jsx";
import { getCustomer } from "../api/customers.api.js";
import { listUnpaidInvoices } from "../api/receipts.api.js";
import { formatBaht, formatDate } from "../utils.js";

export default function ReceiptForm({ onSubmit, submitting, initialData }) {
  const [receiptNo, setReceiptNo] = React.useState("");
  const [receiptDate, setReceiptDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [customerCode, setCustomerCode] = React.useState("");
  const [customerDetails, setCustomerDetails] = React.useState(null);
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false);
  const [invoiceOptions, setInvoiceOptions] = React.useState([]);
  const [items, setItems] = React.useState([{ invoice_no: "", invoice_amount_due: 0, receipt_amount: 0 }]);
  const [autoCode, setAutoCode] = React.useState(true);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, title: "Validation Error", message: "" });

  React.useEffect(() => {
    if (!initialData) return;
    setReceiptNo(initialData.receipt_no || "");
    setReceiptDate(initialData.receipt_date ? new Date(initialData.receipt_date).toISOString().slice(0, 10) : "");
    setCustomerCode(initialData.customer_code || "");
    setAutoCode(false);
    setItems(initialData.line_items?.length ? initialData.line_items : [{ invoice_no: "", invoice_amount_due: 0, receipt_amount: 0 }]);
  }, [initialData]);

  React.useEffect(() => {
    const code = String(customerCode || "").trim();
    if (!code) {
      setCustomerDetails(null);
      setInvoiceOptions([]);
      return;
    }
    let cancelled = false;
    getCustomer(code).then((data) => {
      if (!cancelled) setCustomerDetails(data);
    }).catch(() => {
      if (!cancelled) setCustomerDetails(null);
    });
    listUnpaidInvoices({ customer_code: code, receipt_no: initialData?.receipt_no || "" }).then((rows) => {
      if (!cancelled) setInvoiceOptions(rows);
    }).catch(() => {
      if (!cancelled) setInvoiceOptions([]);
    });
    return () => { cancelled = true; };
  }, [customerCode, initialData?.receipt_no]);

  const totalInvoiceAmountDue = items.reduce((s, it) => s + Number(it.invoice_amount_due || 0), 0);
  const totalAmountReceived = items.reduce((s, it) => s + Number(it.receipt_amount || 0), 0);
  const totalStillRemaining = items.reduce((s, it) => {
    const due = Number(it.invoice_amount_due || 0);
    const received = Number(it.receipt_amount || 0);
    return s + Math.max(due - received, 0);
  }, 0);

  function updateItem(index, patch) {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  }

  function selectInvoice(index, invoiceNo) {
    const inv = invoiceOptions.find((row) => row.invoice_no === invoiceNo);
    updateItem(index, {
      invoice_no: invoiceNo,
      invoice_date: inv?.invoice_date || "",
      invoice_amount_due: Number(inv?.amount_still_remaining ?? inv?.amount_due ?? 0),
      receipt_amount: Number(inv?.amount_still_remaining ?? inv?.amount_due ?? 0),
    });
  }

  function validate() {
    const errs = [];
    if (!receiptDate) errs.push("Date should not be null");
    if (!String(customerCode || "").trim() || !customerDetails) errs.push("Customer must be selected");
    if (!initialData && !autoCode && !String(receiptNo || "").trim()) errs.push("Receipt No should not be null");
    items.forEach((it, index) => {
      const row = index + 1;
      if (!it.invoice_no) errs.push(`Row ${row}: Invoice is required`);
      const amount = Number(it.receipt_amount || 0);
      const due = Number(it.invoice_amount_due || 0);
      if (amount <= 0) errs.push(`Row ${row}: Receipt amount must be positive`);
      if (amount > due) errs.push(`Row ${row}: Receipt amount cannot exceed invoice balance`);
    });
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      setAlertModal({
        isOpen: true,
        title: "Save Failed.",
        message: (
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-main)" }}>
            {errors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        ),
      });
      return;
    }
    onSubmit({
      receipt_no: initialData ? receiptNo.trim() : (autoCode ? "" : receiptNo.trim()),
      receipt_date: receiptDate,
      customer_code: String(customerCode).trim(),
      line_items: items.map((it) => ({
        id: it.id,
        invoice_no: it.invoice_no,
        receipt_amount: Number(it.receipt_amount),
      })),
    });
  }

  const usedInvoices = new Set(items.map((it) => it.invoice_no).filter(Boolean));

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
            <h4>Receipt Details</h4>
            <div style={{ display: "grid", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">{(!initialData && autoCode) ? "Receipt No" : <>Receipt No <span className="required-marker">*</span></>}</label>
                <div className="flex gap-2">
                  <input
                    className="form-control"
                    disabled={autoCode}
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="e.g. RCT26-00001"
                  />
                  {!initialData && (
                    <div className="form-inline-option">
                      <input type="checkbox" checked={autoCode} onChange={(e) => setAutoCode(e.target.checked)} id="rct_auto" />
                      <label htmlFor="rct_auto">Auto</label>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Code <span className="required-marker">*</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-control" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} placeholder="e.g. C100" />
                  <button type="button" className="btn btn-primary" onClick={() => setCustomerModalOpen(true)}>LoV</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-control" disabled value={customerDetails?.name ?? ""} readOnly placeholder="-" />
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Date <span className="required-marker">*</span></label>
                <input type="date" className="form-control" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card invoice-summary-card" style={{ height: "fit-content" }}>
            <h4>Summary</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <span>Invoice Amount Due</span>
                <span>{formatBaht(totalInvoiceAmountDue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <span>Amount Received</span>
                <span>{formatBaht(totalAmountReceived)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 700, color: "var(--primary)" }}>
                <span>Still Remaining</span>
                <span>{formatBaht(totalStillRemaining)}</span>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Saving..." : (initialData ? "Save Changes" : "Create Receipt")}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Receipt Line Items</h4>
            <button type="button" className="btn btn-primary" onClick={() => setItems([...items, { invoice_no: "", invoice_amount_due: 0, receipt_amount: 0 }])}>
              Add Invoice
            </button>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Invoice No <span className="required-marker">*</span></th>
                  <th>Date</th>
                  <th className="text-right">Invoice Amount Due</th>
                  <th className="text-right">Amount Received</th>
                  <th className="text-right">Still Remaining</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, index) => (
                  <tr key={index}>
                    <td>
                      <select className="form-control" value={it.invoice_no || ""} onChange={(e) => selectInvoice(index, e.target.value)}>
                        <option value="">Select invoice</option>
                        {invoiceOptions
                          .filter((row) => row.invoice_no === it.invoice_no || !usedInvoices.has(row.invoice_no))
                          .map((row) => (
                            <option key={row.invoice_no} value={row.invoice_no}>
                              {row.invoice_no} - {formatBaht(row.amount_still_remaining ?? row.amount_due)}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>{it.invoice_date ? formatDate(it.invoice_date) : "-"}</td>
                    <td className="text-right">{formatBaht(it.invoice_amount_due)}</td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="form-control"
                        style={{ textAlign: "right" }}
                        value={it.receipt_amount}
                        onChange={(e) => updateItem(index, { receipt_amount: e.target.value })}
                      />
                    </td>
                    <td className="text-right">{formatBaht(Math.max(Number(it.invoice_amount_due || 0) - Number(it.receipt_amount || 0), 0))}</td>
                    <td className="text-center">
                      <button type="button" className="btn btn-outline" disabled={items.length <= 1} onClick={() => setItems(items.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </form>
    </>
  );
}

