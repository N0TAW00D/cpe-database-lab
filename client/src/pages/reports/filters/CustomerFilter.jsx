import React from "react";
import { listCustomers } from "../../../api/customers.api.js";

export default function CustomerFilter({ value, onChange }) {
  const [customers, setCustomers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    listCustomers({ limit: 999 })
      .then(res => setCustomers(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="filter-group">
      <label className="filter-label">Customer</label>
      <select
        className="form-control"
        value={value}
        onChange={(e) => onChange({ customerCode: e.target.value })}
        disabled={loading}
      >
        <option value="">All Customers</option>
        {customers.map(c => (
          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
        ))}
      </select>
    </div>
  );
}
