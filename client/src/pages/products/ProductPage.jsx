// Product page (View, Create & Edit)
// - /products/new → mode="create"
// - /products/:id → mode="view"
// - /products/:id/edit → mode="edit"
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { listUnits, getProduct, createProduct, updateProduct } from "../../api/products.api.js";
import { formatBaht } from "../../utils.js";
import Loading from "../../components/Loading.jsx";

export default function ProductPage({ mode: propMode }) {
    const { id } = useParams();
    // Determine mode: prop > url detection
    const mode = propMode || (id ? "view" : "create");
    const nav = useNavigate();
    
    const [units, setUnits] = React.useState([]);
    const [err, setErr] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [loading, setLoading] = React.useState(mode !== "create");
    const [autoCode, setAutoCode] = React.useState(true);
    const [form, setForm] = React.useState({
        code: "", name: "", units_id: "", unit_price: ""
    });

    React.useEffect(() => {
        if (mode === "create") {
            listUnits()
                .then(r => setUnits(r?.data ?? r ?? []))
                .catch(e => setErr(String(e.message || e)));
        } else {
            Promise.all([listUnits(), getProduct(id)])
                .then(([unitsRes, product]) => {
                    setUnits(unitsRes?.data ?? unitsRes ?? []);
                    if (product) {
                        setForm({
                            code: product.code || "",
                            name: product.name || "",
                            units_id: product.units_id || "",
                            unit_price: product.unit_price || ""
                        });
                    } else {
                        setErr("Product not found");
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
                await createProduct(payload);
            } else {
                await updateProduct(id, payload);
            }
            nav("/products");
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading size="large" />;
    if (err) return <div className="alert alert-error">{err}</div>;

    const isView = mode === "view";
    const isCreate = mode === "create";
    
    const titles = { create: "Create Product", view: "Product Details", edit: "Edit Product" };
    const title = titles[mode];
    const unit = units.find(u => String(u.id) === String(form.units_id));

    // View Mode - Read Only Display
    if (isView) {
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">{title}</h3>
                    <div className="flex gap-4">
                        <Link to="/products" className="btn btn-outline">← Back</Link>
                        <Link to={`/products/${id}/edit`} className="btn btn-primary">Edit</Link>
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
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Pricing & Unit</h4>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Unit</div>
                                <div>{unit ? `${unit.name} (${unit.code})` : "-"}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Unit Price</div>
                                <div style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--primary)' }}>
                                    {formatBaht(form.unit_price)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create/Edit Mode - Form
    const submitText = isCreate ? "Create Product" : "Update Product";
    const submittingText = isCreate ? "Creating..." : "Updating...";

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">{title}</h3>
                <Link to="/products" className="btn btn-outline">
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
                                        placeholder="P001"
                                    />
                                    <div className="form-inline-option">
                                        <input type="checkbox" checked={autoCode} onChange={e => setAutoCode(e.target.checked)} id="p_auto" />
                                        <label htmlFor="p_auto">Auto</label>
                                    </div>
                                </div>
                            ) : (
                                <input
                                    className="form-control"
                                    required
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value })}
                                    placeholder="P001"
                                />
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <select className="form-control" required value={form.units_id} onChange={e => setForm({ ...form, units_id: e.target.value })}>
                                <option value="">Select Unit</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit Price</label>
                            <input type="number" step="0.01" className="form-control" required value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} placeholder="0.00" />
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
