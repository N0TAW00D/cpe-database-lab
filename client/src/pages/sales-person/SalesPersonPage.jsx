// Sales Person page (View, Create & Edit)
import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { getSalesPerson, createSalesPerson, updateSalesPerson } from "../../api/sales_persons.api.js";
import { formatDate } from "../../utils.js";
import Loading from "../../components/Loading.jsx";
import { AlertModal } from "../../components/Modal.jsx";
import { salesPersonFormSchema } from "../../schemas/sales_person.schema.js";

const defaultValues = {
  code: "",
  name: "",
  start_work_date: "",
};

export default function SalesPersonPage({ mode: propMode }) {
  const { id } = useParams(); // id is the 'code' in this case
  const mode = propMode || (id ? "view" : "create");
  const nav = useNavigate();

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
    resolver: zodResolver(salesPersonFormSchema),
  });

  const form = watch();

  React.useEffect(() => {
    if (mode !== "create") {
      getSalesPerson(id)
        .then((sp) => {
          if (sp) {
            reset({
              code: sp.code || "",
              name: sp.name || "",
              start_work_date: sp.start_work_date ? sp.start_work_date.split('T')[0] : "",
            });
          } else {
            setErr("Sales Person not found");
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

    setErr("");
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (mode === "create" && autoCode) payload.code = "";
      if (!payload.start_work_date) payload.start_work_date = null;

      if (mode === "create") {
        await createSalesPerson(payload);
        toast.success("Sales Person created.");
      } else {
        await updateSalesPerson(id, payload);
        toast.success("Sales Person updated.");
      }
      nav("/sales-person");
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
  const titles = { create: "Create Sales Person", view: "Sales Person Details", edit: "Edit Sales Person" };
  const title = titles[mode];

  if (isView) {
    return (
      <div>
        <div className="page-header">
          <h3 className="page-title">{title}</h3>
          <div className="flex gap-4">
            <Link to="/sales-person" className="btn btn-outline">← Back</Link>
            <Link to={`/sales-person/${id}/edit`} className="btn btn-primary">Edit</Link>
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
              <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Employment Info</h4>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Start Work Date</div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{formatDate(form.start_work_date)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const submitText = isCreate ? "Create Sales Person" : "Update Sales Person";
  const submittingText = isCreate ? "Creating..." : "Updating...";

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">{title}</h3>
        <Link to="/sales-person" className="btn btn-outline">
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
                    placeholder="SP001"
                    {...register("code")}
                  />
                  <div className="form-inline-option">
                    <input type="checkbox" checked={autoCode} onChange={(e) => setAutoCode(e.target.checked)} id="sp_auto" />
                    <label htmlFor="sp_auto">Auto</label>
                  </div>
                </div>
              ) : (
                <input className="form-control" placeholder="SP001" readOnly {...register("code")} />
              )}
              {errors.code && <span className="form-error">{errors.code.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Name <span className="required-marker">*</span></label>
              <input className="form-control" placeholder="Sales Person Name" {...register("name")} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Start Work Date</label>
              <input type="date" className="form-control" {...register("start_work_date")} />
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
