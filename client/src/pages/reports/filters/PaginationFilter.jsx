import React from "react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function PaginationFilter({ page, limit, total, totalPages, onChange }) {
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const btnStyle = {
    padding: '6px 12px',
    border: '1px solid var(--border)',
    background: 'white',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.85rem'
  };

  const btnActiveStyle = { ...btnStyle, background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' };
  const btnDisabledStyle = { ...btnStyle, opacity: 0.5, cursor: 'not-allowed' };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span>Showing {total > 0 ? `${startIndex}-${endIndex}` : 0} of {total}</span>
        <select
          value={limit}
          onChange={(e) => onChange({ limit: Number(e.target.value), page: 1 })}
          className="form-control form-control-compact"
          style={{ marginLeft: 8 }}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="pagination-buttons">
          <button
            onClick={() => onChange({ page: 1 })}
            disabled={page === 1}
            style={page === 1 ? btnDisabledStyle : btnStyle}
          >««</button>
          <button
            onClick={() => onChange({ page: page - 1 })}
            disabled={page === 1}
            style={page === 1 ? btnDisabledStyle : btnStyle}
          >«</button>
          
          {getPageNumbers().map(p => (
            <button
              key={p}
              onClick={() => onChange({ page: p })}
              style={page === p ? btnActiveStyle : btnStyle}
            >{p}</button>
          ))}
          
          <button
            onClick={() => onChange({ page: page + 1 })}
            disabled={page === totalPages}
            style={page === totalPages ? btnDisabledStyle : btnStyle}
          >»</button>
          <button
            onClick={() => onChange({ page: totalPages })}
            disabled={page === totalPages}
            style={page === totalPages ? btnDisabledStyle : btnStyle}
          >»»</button>
        </div>
      )}
    </div>
  );
}
