// Product page (View, Create & Edit)
// Uses react-hook-form + zod for form state and validation
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { listUnits, getProduct, createProduct, updateProduct } from "../../api/products.api.js";
import { formatBaht } from "../../utils.js";
import Loading from "../../components/Loading.jsx";
import { AlertModal } from "../../components/Modal.jsx";
import { productFormSchema } from "../../schemas/product.schema.js";

const defaultValues = {
  code: "",
  name: "",
  units_id: "",
  unit_price: "",
};

export default function ProductPage({ mode: propMode }) {
  const { id } = useParams();
  const mode = propMode || (id ? "view" : "create");
  const nav = useNavigate();

  const [units, setUnits] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(mode !== "create");
  const [autoCode, setAutoCode] = React.useState(true);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, title: "Validation Error", message: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues,
    resolver: zodResolver(productFormSchema),
  });

  const form = watch();

  React.useEffect(() => {
    if (mode === "create") {
      listUnits()
        .then((r) => setUnits(r?.data ?? r ?? []))
        .catch((e) => setErr(String(e.message || e)));
    } else {
      Promise.all([listUnits(), getProduct(id)])
        .then(([unitsRes, product]) => {
          setUnits(unitsRes?.data ?? unitsRes ?? []);
          if (product) {
            reset({
              code: product.code || "",
              name: product.name || "",
              units_id: product.units_id ?? "",
              unit_price: product.unit_price ?? "",
            });
          } else {
            setErr("Product not found");
          }
          setLoading(false);
        })
        .catch((e) => {
          setErr(String(e.message || e));
          setLoading(false);
        });
    }
  }, [id, mode, reset]);

  const onInvalid = (errs) => {
    const list = Object.values(errs).map((e) => e?.message).filter(Boolean);
    setAlertModal({
      isOpen: true,
      title: "Save Failed.",
      message: (
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-main)" }}>
          {list.map((msg, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{msg}</li>
          ))}
        </ul>
      ),
    });
  };

  const onValid = async (data) => {
    if (mode === "create" && !autoCode && !String(data.code || "").trim()) {
      setAlertModal({
        isOpen: true,
        title: "Save Failed.",
        message: <ul style={{ margin: 0, paddingLeft: 20 }}><li>Code should not be null</li></ul>,
      });
      return;
    }
    if (mode !== "create" && !String(data.code || "").trim()) {
      setAlertModal({
        isOpen: true,
        title: "Save Failed.",
        message: <ul style={{ margin: 0, paddingLeft: 20 }}><li>Code should not be null</li></ul>,
      });
      return;
    }

    setErr("");
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (mode === "create" && autoCode) payload.code = "";

      if (mode === "create") {
        await createProduct(payload);
        toast.success("Product created.");
      } else {
        await updateProduct(id, payload);
        toast.success("Product updated.");
      }
      nav("/products");
    } catch (e) {
      const msg = String(e.message || e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading size="large" />;

  const isView = mode === "view";
  const isCreate = mode === "create";
  const titles = { create: "Create Product", view: "Product Details", edit: "Edit Product" };
  const title = titles[mode];
  const unit = units.find((u) => String(u.id) === String(form.units_id));

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Basic Information</h4>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Code</div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{form.code}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Name</div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{form.name}</div>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Pricing & Unit</h4>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Unit</div>
                <div>{unit ? `${unit.name} (${unit.code})` : "-"}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Unit Price</div>
                <div style={{ fontWeight: 600, fontSize: "1.25rem", color: "var(--primary)" }}>
                  {formatBaht(form.unit_price)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((p) => ({ ...p, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
      />

      <div className="card">
        <form onSubmit={handleSubmit(onValid, onInvalid)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group">
              <label className="form-label">{(isCreate && autoCode) ? "Code" : <>Code <span className="required-marker">*</span></>}</label>
              {isCreate ? (
                <div className="flex gap-2">
                  <input
                    className="form-control"
                    disabled={autoCode}
                    placeholder="P001"
                    {...register("code")}
                  />
                  <div className="form-inline-option">
                    <input type="checkbox" checked={autoCode} onChange={(e) => setAutoCode(e.target.checked)} id="p_auto" />
                    <label htmlFor="p_auto">Auto</label>
                  </div>
                </div>
              ) : (
                <input className="form-control" placeholder="P001" {...register("code")} />
              )}
              {errors.code && <span className="form-error">{errors.code.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Name <span className="required-marker">*</span></label>
              <input className="form-control" placeholder="Product Name" {...register("name")} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Unit <span className="required-marker">*</span></label>
              <select className="form-control" {...register("units_id")}>
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
              {errors.units_id && <span className="form-error">{errors.units_id.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price <span className="required-marker">*</span></label>
              <input type="number" step="0.01" className="form-control" placeholder="0.00" {...register("unit_price")} />
              {errors.unit_price && <span className="form-error">{errors.unit_price.message}</span>}
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
