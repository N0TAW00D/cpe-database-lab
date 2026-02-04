// Customer page (View, Create & Edit)
// - /customers/new → mode="create"
// - /customers/:id → mode="view"
// - /customers/:id/edit → mode="edit"
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { listCountries, getCustomer, createCustomer, updateCustomer } from "../../api/customers.api.js";
import { formatBaht } from "../../utils.js";

export default function CustomerPage({ mode: propMode }) {
    const { id } = useParams();
    // Determine mode: prop > url detection
    const mode = propMode || (id ? "view" : "create");
    const nav = useNavigate();
    
    const [countries, setCountries] = React.useState([]);
    const [err, setErr] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [loading, setLoading] = React.useState(mode !== "create");
    const [autoCode, setAutoCode] = React.useState(false);
    const [form, setForm] = React.useState({
        code: "", name: "", address_line1: "", address_line2: "", country_id: "", credit_limit: ""
    });

    React.useEffect(() => {
        if (mode === "create") {
            listCountries()
                .then(setCountries)
                .catch(e => setErr(String(e.message || e)));
        } else {
            Promise.all([listCountries(), getCustomer(id)])
                .then(([countries, customer]) => {
                    setCountries(countries);
                    if (customer) {
                        setForm({
                            code: customer.code || "",
                            name: customer.name || "",
                            address_line1: customer.address_line1 || "",
                            address_line2: customer.address_line2 || "",
                            country_id: customer.country_id || "",
                            credit_limit: customer.credit_limit || ""
                        });
                    } else {
                        setErr("Customer not found");
                    }
                    setLoading(false);
                })
                .catch(e => {
                    setErr(String(e.message || e));
                    setLoading(false);
                });
        }
    }, [id, mode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (mode === "create" && autoCode) payload.code = "";
            
            if (mode === "create") {
                await createCustomer(payload);
            } else {
                await updateCustomer(id, payload);
            }
            nav("/customers");
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-4">Loading...</div>;
    if (err) return <div className="alert alert-error">{err}</div>;

    const isView = mode === "view";
    const isCreate = mode === "create";
    
    const titles = { create: "Create Customer", view: "Customer Details", edit: "Edit Customer" };
    const title = titles[mode];
    const country = countries.find(c => String(c.id) === String(form.country_id));

    // View Mode - Read Only Display
    if (isView) {
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">{title}</h3>
                    <div className="flex gap-4">
                        <Link to="/customers" className="btn btn-outline">← Back</Link>
                        <Link to={`/customers/${id}/edit`} className="btn btn-primary">Edit</Link>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Basic Information</h4>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Code</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{form.code}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{form.name}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Credit Limit</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>
                                    {form.credit_limit ? formatBaht(form.credit_limit) : "-"}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Address</h4>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address Line 1</div>
                                <div>{form.address_line1 || "-"}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address Line 2</div>
                                <div>{form.address_line2 || "-"}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Country</div>
                                <div>{country ? country.name : "-"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create/Edit Mode - Form
    const submitText = isCreate ? "Create Customer" : "Update Customer";
    const submittingText = isCreate ? "Creating..." : "Updating...";

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">{title}</h3>
                <Link to="/customers" className="btn btn-outline">
                    <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </Link>
            </div>

            {err && <div className="alert alert-error">{err}</div>}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            {isCreate ? (
                                <div className="flex gap-2">
                                    <input
                                        className="form-control"
                                        required={!autoCode}
                                        disabled={autoCode}
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value })}
                                        placeholder="C001"
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="checkbox" checked={autoCode} onChange={e => setAutoCode(e.target.checked)} id="c_auto" />
                                        <label htmlFor="c_auto" style={{ marginLeft: 4, fontSize: '0.8rem' }}>Auto</label>
                                    </div>
                                </div>
                            ) : (
                                <input
                                    className="form-control"
                                    required
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value })}
                                    placeholder="C001"
                                />
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer Name" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Address Line 1</label>
                            <input className="form-control" value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} placeholder="Address Line 1" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address Line 2</label>
                            <input className="form-control" value={form.address_line2} onChange={e => setForm({ ...form, address_line2: e.target.value })} placeholder="Address Line 2" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <select className="form-control" required value={form.country_id} onChange={e => setForm({ ...form, country_id: e.target.value })}>
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Credit Limit</label>
                            <input type="number" step="0.01" className="form-control" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })} placeholder="0.00" />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? submittingText : submitText}
                    </button>
                </form>
            </div>
        </div>
    );
}
