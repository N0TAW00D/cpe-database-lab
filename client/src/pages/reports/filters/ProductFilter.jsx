import React from "react";
import { listProducts } from "../../../api/products.api.js";

export default function ProductFilter({ value, onChange }) {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    listProducts({ limit: 999 })
      .then(res => setProducts(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="filter-group">
      <label className="filter-label">Product</label>
      <select
        className="form-control"
        value={value}
        onChange={(e) => onChange({ productCode: e.target.value })}
        disabled={loading}
      >
        <option value="">All Products</option>
        {products.map(p => (
          <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
        ))}
      </select>
    </div>
  );
}
