import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../../components/Loading.jsx";
import ReceiptForm from "../../components/ReceiptForm.jsx";
import { createReceipt, getReceipt, updateReceipt } from "../../api/receipts.api.js";
import { formatBaht, formatDate } from "../../utils.js";

export default function ReceiptPage({ mode: propMode }) {
  const { id } = useParams();
  const mode = propMode || (id ? "view" : "create");
  const nav = useNavigate();
  const [receiptData, setReceiptData] = React.useState(null);
  const [initialData, setInitialData] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (mode === "create") {
      setLoading(false);
      return;
    }
    getReceipt(id)
      .then((data) => {
        setReceiptData(data);
        const h = data.header;
        setInitialData({
          receipt_no: h.receipt_no,
          receipt_date: h.receipt_date,
          customer_code: h.customer_code,
          line_items: data.line_items.map((li) => ({
            id: li.id,
            invoice_no: li.invoice_no,
            invoice_date: li.invoice_date,
            invoice_amount_due: Number(li.invoice_amount_due || 0),
            receipt_amount: Number(li.receipt_amount || 0),
            invoice_amount_still_remaining: Number(li.invoice_amount_still_remaining || 0),
          })),
        });
        setLoading(false);
      })
      .catch((e) => {
        setErr(String(e.message || e));
        setLoading(false);
      });
  }, [id, mode]);

  async function onSubmit(payload) {
    setErr("");
    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await createReceipt(payload);
        toast.success("Receipt created.");
        nav(`/receipts/${encodeURIComponent(res.receipt_no)}`);
      } else {
        const res = await updateReceipt(id, payload);
        toast.success("Receipt updated.");
        nav(`/receipts/${encodeURIComponent(res.receipt_no || id)}`);
      }
    } catch (e) {
      const msg = String(e.message || e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading size="large" />;

  if (mode === "view" && receiptData) {
    const h = receiptData.header;
    const lines = receiptData.line_items || [];
    return (
      <div className="invoice-preview">
        <div className="page-header no-print">
          <h3 className="page-title">Receipt {h.receipt_no}</h3>
          <div className="flex gap-4">
            <Link to="/receipts" className="btn btn-outline">Back</Link>
            <Link to={`/receipts/${id}/edit`} className="btn btn-outline">Edit</Link>
            <button onClick={() => window.print()} className="btn btn-primary">Print PDF</button>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between mb-4">
            <div>
              <div className="brand mb-4">InvoiceDoc v2</div>
              <div className="font-bold">Customer</div>
              <div>{h.customer_code} {h.customer_name}</div>
              <div className="text-muted">{h.address_line1 || "-"}</div>
              <div className="text-muted">{h.address_line2 || ""}</div>
              <div className="text-muted">{h.country_name || "-"}</div>
            </div>
            <div className="text-right">
              <h2 className="mb-4">RECEIPT</h2>
              <div><span className="font-bold">Date:</span> {formatDate(h.receipt_date)}</div>
              <div><span className="font-bold">Receipt No:</span> {h.receipt_no}</div>
            </div>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th className="text-right">Invoice Amount Due</th>
                  <th className="text-right">Amount Received</th>
                  <th className="text-right">Still Remaining</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((li) => (
                  <tr key={li.id}>
                    <td>{li.invoice_no}</td>
                    <td>{formatDate(li.invoice_date)}</td>
                    <td className="text-right">{formatBaht(li.invoice_amount_due)}</td>
                    <td className="text-right font-bold">{formatBaht(li.receipt_amount)}</td>
                    <td className="text-right">{formatBaht(li.invoice_amount_still_remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between">
            <div className="text-muted" style={{ maxWidth: 300, fontSize: "0.8rem" }}>
              Payment received for the invoices listed above.
            </div>
            <div style={{ minWidth: 300 }}>
              <div className="flex justify-between mb-1">
                <span>Total Invoice Amount Due:</span>
                <span>{formatBaht(h.total_invoice_amount_due)}</span>
              </div>
              <div className="flex justify-between mb-1 font-bold">
                <span>Total Amount Received:</span>
                <span>{formatBaht(h.total_amount_received)}</span>
              </div>
              <div className="flex justify-between mt-4 p-2 bg-body font-bold" style={{ color: "var(--primary)" }}>
                <span>Total Still Remaining:</span>
                <span>{formatBaht(h.total_amount_still_remaining)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = mode === "create" ? "Create Receipt" : `Edit Receipt ${id}`;
  return (
    <div className="invoice-page">
      <div className="page-header">
        <h3 className="page-title">{title}</h3>
        <Link to="/receipts" className="btn btn-outline">Back</Link>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      <ReceiptForm onSubmit={onSubmit} submitting={submitting} initialData={mode === "create" ? null : initialData} />
    </div>
  );
}

