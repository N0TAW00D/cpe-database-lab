import React from "react";
import DateRangeFilter from "./DateRangeFilter.jsx";
import ProductFilter from "./ProductFilter.jsx";
import CustomerFilter from "./CustomerFilter.jsx";
import YearMonthFilter from "./YearMonthFilter.jsx";

export default function ReportFilters({ type, filters, onChange, onApply, onReset }) {
  const handleChange = (patch) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="report-filters">
      <div className="filters-grid">
        {/* Product Sales Filters */}
        {type === "product-sales" && (
          <>
            <ProductFilter value={filters.productCode || ""} onChange={handleChange} />
            <DateRangeFilter 
              dateFrom={filters.dateFrom || ""} 
              dateTo={filters.dateTo || ""} 
              onChange={handleChange} 
            />
          </>
        )}

        {/* Monthly Sales Filters */}
        {type === "monthly-sales" && (
          <>
            <ProductFilter value={filters.productCode || ""} onChange={handleChange} />
            <YearMonthFilter 
              year={filters.year || ""} 
              month={filters.month || ""} 
              onChange={handleChange} 
            />
            <DateRangeFilter 
              dateFrom={filters.dateFrom || ""} 
              dateTo={filters.dateTo || ""} 
              onChange={handleChange} 
            />
          </>
        )}

        {/* Customer Sales Filters */}
        {type === "customer-sales" && (
          <>
            <ProductFilter value={filters.productCode || ""} onChange={handleChange} />
            <CustomerFilter value={filters.customerCode || ""} onChange={handleChange} />
            <DateRangeFilter 
              dateFrom={filters.dateFrom || ""} 
              dateTo={filters.dateTo || ""} 
              onChange={handleChange} 
            />
          </>
        )}
      </div>

      <div className="filters-actions">
        <button type="button" className="btn btn-outline" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="btn btn-primary" onClick={onApply}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Apply Filters
        </button>
      </div>
    </div>
  );
}
