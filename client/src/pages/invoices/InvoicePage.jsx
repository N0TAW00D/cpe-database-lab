// Invoice page (View, Create & Edit)
// - /invoices/new → mode="create"
// - /invoices/:id → mode="view"
// - /invoices/:id/edit → mode="edit"
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { getInvoice, createInvoice, updateInvoice } from "../../api/invoices.api.js";
import { toast } from "react-toastify";
import { formatBaht, formatDate } from "../../utils.js";
import InvoiceForm from "../../components/InvoiceForm.jsx";
import Loading from "../../components/Loading.jsx";

export default function InvoicePage({ mode: propMode }) {
    const { id } = useParams();
    const mode = propMode || (id ? "view" : "create");
    const nav = useNavigate();
    
    const [invoiceData, setInvoiceData] = React.useState(null);
    const [initialData, setInitialData] = React.useState(null);
    const [err, setErr] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (mode === "create") {
            // No need to preload data - search will fetch on demand
            setLoading(false);
        } else if (mode === "view") {
            getInvoice(id)
                .then((data) => {
                    setInvoiceData(data);
                    setLoading(false);
                })
                .catch((e) => {
                    setErr(String(e.message || e));
                    setLoading(false);
                });
        } else {
            // edit mode - only load the invoice
            getInvoice(id)
                .then((inv) => {
                    setInvoiceData(inv);
                    
                    const h = inv.header;
                    const total = Number(h.total_amount);
                    const vat = Math.round(Number(h.vat) * 100) / 100;
                    const rate = total > 0 ? (vat / total) : 0.07;

                    setInitialData({
                        invoice_no: h.invoice_no,
                        customer_code: h.customer_code,
                        customer_label: `${h.customer_code || ''} - ${h.customer_name}`.replace(/^ - /, ''),
                        invoice_date: h.invoice_date,
                        vat_rate: rate,
                        line_items: inv.line_items.map(li => ({
                            product_code: li.product_code,
                            product_label: `${li.product_code} - ${li.product_name}`,
                            quantity: li.quantity,
                            unit_price: li.unit_price
                        }))
                    });
                    setLoading(false);
                })
                .catch((e) => {
                    setErr(String(e.message || e));
                    setLoading(false);
                });
        }
    }, [id, mode]);

    async function onSubmit(payload) {
        setErr("");
        setSubmitting(true);
        try {
            if (mode === "create") {
                const res = await createInvoice(payload);
                toast.success("Invoice created.");
                nav(`/invoices/${encodeURIComponent(res.invoice_no)}`);
            } else {
                await updateInvoice(id, payload);
                toast.success("Invoice updated.");
                nav(`/invoices/${encodeURIComponent(id)}`);
            }
        } catch (e) {
            const msg = String(e.message || e);
            setErr(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    const handlePrint = () => window.print();

    if (loading) return <Loading size="large" />;

    const isView = mode === "view";
    const isCreate = mode === "create";

    // View Mode - Invoice Preview with Print
    if (isView && invoiceData) {
        const h = invoiceData.header;
        const lines = invoiceData.line_items || [];

        return (
            <div className="invoice-preview">
                <div className="page-header no-print">
                    <h3 className="page-title">Invoice {h.invoice_no}</h3>
                    <div className="flex gap-4">
                        <Link to="/invoices" className="btn btn-outline">← Back</Link>
                        <Link to={`/invoices/${id}/edit`} className="btn btn-outline">Edit</Link>
                        <button onClick={handlePrint} className="btn btn-primary">
                            <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Print PDF
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between mb-4">
                        <div>
                            <div className="brand mb-4">InvoiceDoc v2</div>
                            <div className="font-bold">Customer</div>
                            <div>{h.customer_name}</div>
                            <div className="text-muted">{h.address_line1 || "-"}</div>
                            <div className="text-muted">{h.address_line2 || ""}</div>
                            <div className="text-muted">{h.country_name || "-"}</div>
                        </div>
                        <div className="text-right">
                            <h2 className="mb-4">INVOICE</h2>
                            <div><span className="font-bold">Date:</span> {formatDate(h.invoice_date)}</div>
                            <div><span className="font-bold">Invoice No:</span> {h.invoice_no}</div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Unit</th>
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Unit Price</th>
                                    <th className="text-right">Extended</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((li) => (
                                    <tr key={li.id}>
                                        <td>{li.product_code} - {li.product_name}</td>
                                        <td>{li.units_code}</td>
                                        <td className="text-right">{Number(li.quantity || 0).toFixed(2)}</td>
                                        <td className="text-right">{formatBaht(li.unit_price)}</td>
                                        <td className="text-right font-bold">{formatBaht(li.extended_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex justify-between">
                        <div className="no-print text-muted" style={{ maxWidth: 300, fontSize: '0.8rem' }}>
                            Thank you for your business. Please pay within 30 days.
                        </div>
                        <div style={{ minWidth: 200 }}>
                            <div className="flex justify-between mb-2">
                                <span>Subtotal:</span>
                                <span>{formatBaht(h.total_amount)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span>VAT:</span>
                                <span>{formatBaht(h.vat)}</span>
                            </div>
                            <div className="flex justify-between mt-4 p-2 bg-body font-bold" style={{ fontSize: '1.1rem' }}>
                                <span>Total Due:</span>
                                <span>{formatBaht(h.amount_due)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create/Edit Mode - Form
    const title = isCreate ? "Create Invoice" : `Edit Invoice ${id}`;

    return (
        <div className="invoice-page">
            <div className="page-header">
                <h3 className="page-title">{title}</h3>
                <Link to="/invoices" className="btn btn-outline">
                    <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </Link>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <InvoiceForm
                onSubmit={onSubmit}
                submitting={submitting}
                initialData={isCreate ? null : initialData}
            />
        </div>
    );
}
