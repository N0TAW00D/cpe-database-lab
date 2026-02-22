// Customer page (View, Create & Edit)
// Uses react-hook-form + zod for form state and validation
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { listCountries, getCustomer, createCustomer, updateCustomer } from "../../api/customers.api.js";
import { formatBaht } from "../../utils.js";
import Loading from "../../components/Loading.jsx";
import { AlertModal } from "../../components/Modal.jsx";
import { customerFormSchema } from "../../schemas/customer.schema.js";

const defaultValues = {
  code: "",
  name: "",
  address_line1: "",
  address_line2: "",
  country_id: "",
  credit_limit: "",
};

export default function CustomerPage({ mode: propMode }) {
  const { id } = useParams();
  const mode = propMode || (id ? "view" : "create");
  const nav = useNavigate();

  const [countries, setCountries] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(mode !== "create");
  const [autoCode, setAutoCode] = React.useState(true);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, title: "Validation Error", message: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    reset,
  } = useForm({
    defaultValues,
    resolver: zodResolver(customerFormSchema),
  });

  const form = watch();

  React.useEffect(() => {
    if (mode === "create") {
      listCountries()
        .then((r) => setCountries(r?.data ?? r ?? []))
        .catch((e) => setErr(String(e.message || e)));
    } else {
      Promise.all([listCountries(), getCustomer(id)])
        .then(([countriesRes, customer]) => {
          setCountries(countriesRes?.data ?? countriesRes ?? []);
          if (customer) {
            reset({
              code: customer.code || "",
              name: customer.name || "",
              address_line1: customer.address_line1 || "",
              address_line2: customer.address_line2 || "",
              country_id: customer.country_id != null ? String(customer.country_id) : "",
              credit_limit: customer.credit_limit !== "" && customer.credit_limit != null ? String(customer.credit_limit) : "",
            });
          } else {
            setErr("Customer not found");
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
      setError("code", { message: "Code should not be null" });
      setAlertModal({
        isOpen: true,
        title: "Save Failed.",
        message: <ul style={{ margin: 0, paddingLeft: 20 }}><li>Code should not be null</li></ul>,
      });
      return;
    }
    if (mode !== "create" && !String(data.code || "").trim()) {
      setError("code", { message: "Code should not be null" });
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
      if (payload.credit_limit === "" || payload.credit_limit == null) payload.credit_limit = null;
      else payload.credit_limit = Number(payload.credit_limit);
      if (payload.country_id !== "" && payload.country_id != null) payload.country_id = Number(payload.country_id);

      if (mode === "create") {
        await createCustomer(payload);
        toast.success("Customer created.");
      } else {
        await updateCustomer(id, payload);
        toast.success("Customer updated.");
      }
      nav("/customers");
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
  const titles = { create: "Create Customer", view: "Customer Details", edit: "Edit Customer" };
  const title = titles[mode];
  const country = countries.find((c) => String(c.id) === String(form.country_id));

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
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Credit Limit</div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--primary)" }}>
                  {form.credit_limit ? formatBaht(form.credit_limit) : "-"}
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Address</h4>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Address Line 1</div>
                <div>{form.address_line1 || "-"}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Address Line 2</div>
                <div>{form.address_line2 || "-"}</div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Country</div>
                <div>{country ? country.name : "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    placeholder="C001"
                    {...register("code")}
                  />
                  <div className="form-inline-option">
                    <input type="checkbox" checked={autoCode} onChange={(e) => setAutoCode(e.target.checked)} id="c_auto" />
                    <label htmlFor="c_auto">Auto</label>
                  </div>
                </div>
              ) : (
                <input className="form-control" placeholder="C001" {...register("code")} />
              )}
              {errors.code && <span className="form-error">{errors.code.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Name <span className="required-marker">*</span></label>
              <input className="form-control" placeholder="Customer Name" {...register("name")} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input className="form-control" placeholder="Address Line 1" {...register("address_line1")} />
            </div>
            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input className="form-control" placeholder="Address Line 2" {...register("address_line2")} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Country <span className="required-marker">*</span></label>
              <select className="form-control" {...register("country_id")}>
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.country_id && <span className="form-error">{errors.country_id.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Credit Limit</label>
              <input type="number" step="0.01" className="form-control" placeholder="0.00" {...register("credit_limit")} />
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
