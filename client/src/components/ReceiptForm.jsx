// Receipt form: select customer, choose unpaid invoices, enter payment amounts.
import React from "react";
import CustomerPickerModal from "./CustomerPickerModal.jsx";
import ListPickerModal from "./ListPickerModal.jsx";
import { AlertModal } from "./Modal.jsx";
import { getCustomer } from "../api/customers.api.js";
import { listUnpaidInvoices } from "../api/receipts.api.js";
import { formatBaht, formatDate } from "../utils.js";

export default function ReceiptForm({ onSubmit, submitting, initialData }) {
  const [receiptNo, setReceiptNo] = React.useState("");
  const [receiptDate, setReceiptDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [customerCode, setCustomerCode] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [paymentNotes, setPaymentNotes] = React.useState("");
  const [customerDetails, setCustomerDetails] = React.useState(null);
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [invoiceModalRow, setInvoiceModalRow] = React.useState(0);
  const [invoiceOptions, setInvoiceOptions] = React.useState([]);
  const [items, setItems] = React.useState([{ invoice_no: "", full_amount_due: 0, already_received: 0, invoice_amount_due: 0, receipt_amount: 0 }]);
  const [autoCode, setAutoCode] = React.useState(true);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, title: "Validation Error", message: "" });

  React.useEffect(() => {
    if (!initialData) return;
    setReceiptNo(initialData.receipt_no || "");
    setReceiptDate(initialData.receipt_date ? new Date(initialData.receipt_date).toISOString().slice(0, 10) : "");
    setCustomerCode(initialData.customer_code || "");
    setPaymentMethod(initialData.payment_method || "cash");
    setPaymentNotes(initialData.payment_notes || "");
    setAutoCode(false);
    setItems(initialData.line_items?.length ? initialData.line_items.map(it => ({
      ...it,
      full_amount_due: Number(it.full_amount_due || it.invoice_amount_due || 0),
      already_received: Number(it.already_received || 0),
      invoice_amount_due: Number(it.invoice_amount_due || 0),
      receipt_amount: Number(it.receipt_amount || 0)
    })) : [{ invoice_no: "", full_amount_due: 0, already_received: 0, invoice_amount_due: 0, receipt_amount: 0 }]);
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

  // Sync loaded items with invoiceOptions to get Full Amount Due if it was missing
  React.useEffect(() => {
    if (initialData && invoiceOptions.length > 0) {
      setItems(prev => prev.map(it => {
        if (!it.invoice_no) return it;
        const opt = invoiceOptions.find(o => o.invoice_no === it.invoice_no);
        if (opt) {
          const fullDue = Number(opt.amount_due || 0);
          const alreadyReceived = Number(opt.amount_already_received || 0);
          const remain = Number(opt.amount_still_remaining ?? fullDue);
          // The API excludes the current receipt, so this matches the PDF's edit-case rule.
          return {
            ...it,
            full_amount_due: fullDue,
            already_received: alreadyReceived,
            invoice_amount_due: remain
          };
        }
        return it;
      }));
    }
  }, [invoiceOptions, initialData]);

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

  function selectInvoice(index, invoice) {
    const inv = typeof invoice === "string"
      ? invoiceOptions.find((row) => row.invoice_no === invoice)
      : invoice;
    const invoiceNo = inv?.invoice_no || "";
    const fullAmountDue = Number(inv?.amount_due || 0);
    const amountRemaining = Number(inv?.amount_still_remaining ?? fullAmountDue);
    const alreadyReceived = Number(inv?.amount_already_received || 0);

    updateItem(index, {
      invoice_no: invoiceNo,
      invoice_date: inv?.invoice_date || "",
      full_amount_due: fullAmountDue,
      already_received: alreadyReceived,
      invoice_amount_due: amountRemaining,
      receipt_amount: amountRemaining,
    });
  }

  function openInvoiceLov(index) {
    const code = String(customerCode || "").trim();
    if (!code || !customerDetails) {
      setAlertModal({
        isOpen: true,
        title: "Select Customer First",
        message: "Please select a valid customer before choosing an invoice.",
      });
      return;
    }
    setInvoiceModalRow(index);
    setInvoiceModalOpen(true);
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
      payment_method: paymentMethod,
      payment_notes: paymentNotes,
      line_items: items.map((it) => ({
        id: it.id,
        invoice_no: it.invoice_no,
        receipt_amount: Number(it.receipt_amount),
      })),
    });
  }

  const selectedInvoiceNos = React.useMemo(
    () => items.map((it) => it.invoice_no).filter(Boolean),
    [items]
  );
  const invoiceColumns = [
    { key: "invoice_no", label: "Invoice No" },
    { key: "invoice_date", label: "Date", render: (v) => v ? formatDate(v) : "-" },
    { key: "amount_due", label: "Full Amount Due", align: "right", render: (v) => formatBaht(v) },
    { key: "amount_already_received", label: "Already Received", align: "right", render: (v) => formatBaht(v) },
    { key: "amount_still_remaining", label: "Amount Remaining", align: "right", render: (v) => formatBaht(v) },
  ];
  const fetchInvoiceLov = React.useCallback(async ({ search = "" } = {}) => {
    const rows = await listUnpaidInvoices({
      customer_code: customerCode,
      receipt_no: initialData?.receipt_no || "",
    });
    const currentInvoice = items[invoiceModalRow]?.invoice_no;
    const usedInvoices = new Set(selectedInvoiceNos);
    const term = String(search || "").trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const availableForRow = row.invoice_no === currentInvoice || !usedInvoices.has(row.invoice_no);
      const matchesSearch = !term || String(row.invoice_no || "").toLowerCase().includes(term);
      return availableForRow && matchesSearch;
    });
    return { data: filtered, total: filtered.length, page: 1, limit: filtered.length || 10, totalPages: 1 };
  }, [customerCode, initialData?.receipt_no, invoiceModalRow, items, selectedInvoiceNos]);

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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                <label className="form-label">Receipt Date <span className="required-marker">*</span></label>
                <input type="date" className="form-control" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
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
                <label className="form-label">Payment Method</label>
                <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Notes</label>
                <input className="form-control" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="e.g. Check #1031..." />
              </div>
            </div>
          </div>

          <div className="card invoice-summary-card" style={{ height: "fit-content" }}>
            <h4>Summary</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <span>Amount Remaining (Sum)</span>
                <span>{formatBaht(totalInvoiceAmountDue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                <span>Amount Received Here</span>
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
            <button type="button" className="btn btn-primary" onClick={() => setItems([...items, { invoice_no: "", full_amount_due: 0, already_received: 0, invoice_amount_due: 0, receipt_amount: 0 }])}>
              Add Row
            </button>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Invoice No. <span className="required-marker">*</span></th>
                  <th className="text-right">Full Amount Due</th>
                  <th className="text-right">Amount Already Received</th>
                  <th className="text-right">Amount Remaining</th>
                  <th className="text-right">Amount Received Here <span className="required-marker">*</span></th>
                  <th className="text-right">Amount Still Remaining</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="form-control" readOnly value={it.invoice_no || ""} placeholder="Select invoice" />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openInvoiceLov(index)}
                        >
                          LoV
                        </button>
                      </div>
                    </td>
                    <td className="text-right">{formatBaht(it.full_amount_due)}</td>
                    <td className="text-right">{formatBaht(it.already_received)}</td>
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
        <ListPickerModal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          onSelect={(row) => {
            selectInvoice(invoiceModalRow, row);
            setInvoiceModalOpen(false);
          }}
          title="Select Unpaid Invoice"
          searchPlaceholder="Search invoice..."
          fetchData={fetchInvoiceLov}
          columns={invoiceColumns}
          itemName="invoice"
          emptyDefault={customerDetails ? "No unpaid invoices for this customer." : "Select a customer first."}
          initialSearch={items[invoiceModalRow]?.invoice_no || ""}
        />
      </form>
    </>
  );
}
