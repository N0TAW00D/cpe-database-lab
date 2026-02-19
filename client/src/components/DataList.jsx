// Reusable data list component with server-side search, sort, pagination
// Usage: <DataList columns={[...]} fetchData={fn} ... />
import React from "react";
import { Link } from "react-router-dom";
import { TableLoading } from "./Loading.jsx";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Reusable list table: search, sort, pagination.
 * - onDelete(id): called when user clicks Delete (parent shows confirm modal, then calls API and increments refreshTrigger).
 * - refreshTrigger: when this value changes, the list refetches (e.g. after a successful delete).
 */
export default function DataList({
    title,
    fetchData,
    columns = [],
    searchPlaceholder = "Search...",
    itemName = "items",
    basePath = "",
    onDelete,
    emptyMessage,
    defaultPageSize = 10,
    refreshTrigger = 0
}) {
    const [data, setData] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    
    const [search, setSearch] = React.useState("");
    const [searchInput, setSearchInput] = React.useState("");
    const [sortKey, setSortKey] = React.useState(null);
    const [sortDir, setSortDir] = React.useState("asc");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(defaultPageSize);

    // Debounce search: update 300ms after user stops typing to avoid firing API on every keystroke
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch data when params change
    const loadData = React.useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                search,
                page: currentPage,
                limit: pageSize,
            };
            if (sortKey) {
                params.sortBy = sortKey;
                params.sortDir = sortDir;
            }
            const result = await fetchData(params);
            const nextTotalPages = Number(result.totalPages || 0);
            if (nextTotalPages > 0 && currentPage > nextTotalPages) {
                setCurrentPage(nextTotalPages);
                return;
            }
            if (nextTotalPages === 0 && currentPage !== 1) {
                setCurrentPage(1);
            }

            setData(result.data || []);
            setTotal(result.total || 0);
            setTotalPages(nextTotalPages);
        } catch (e) {
            setError(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }, [fetchData, search, currentPage, pageSize, sortKey, sortDir, refreshTrigger]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle column header click for sorting
    const handleSort = (key, sortable) => {
        if (sortable === false) return;
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setCurrentPage(1);
    };

    // Notify parent that user clicked Delete; parent shows modal, calls API, then passes new refreshTrigger to refetch
    const handleDelete = (id) => {
        onDelete?.(id);
    };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    // Sort icon component
    const SortIcon = ({ columnKey, sortable }) => {
        if (sortable === false) return null;
        const isActive = sortKey === columnKey;
        return (
            <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.3 }}>
                {isActive && sortDir === "desc" ? "▼" : "▲"}
            </span>
        );
    };

    const btnStyle = {
        padding: '6px 12px',
        border: '1px solid #e2e8f0',
        background: 'white',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '0.85rem',
        outline: 'none',
        color: '#0f172a'
    };

    const btnActiveStyle = {
        padding: '6px 12px',
        border: '1px solid #6366f1',
        background: '#6366f1',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '0.85rem',
        outline: 'none',
        color: 'white'
    };

    const btnDisabledStyle = {
        ...btnStyle,
        opacity: 0.5,
        cursor: 'not-allowed'
    };

    const handleBtnClick = (callback) => (e) => {
        e.target.blur();
        callback();
    };

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + data.length, total);
    const rangeLabel = loading
        ? "Loading..."
        : total === 0
            ? `0 ${itemName}`
            : data.length === 0
                ? `0 ${itemName}`
                : `${startIndex + 1}-${endIndex} of ${total} ${itemName}`;

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">{title}</h3>
                <Link to={`${basePath}/new`} className="btn btn-primary">
                    <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create New
                </Link>
            </div>

            <div className="card">
                {error && <div className="alert alert-error">{error}</div>}

                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', width: 280 }}>
                        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={searchPlaceholder}
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {rangeLabel}
                        </span>
                        <select 
                            value={pageSize} 
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            className="form-control form-control-compact"
                        >
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <option key={size} value={size}>{size} / page</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th 
                                        key={col.key} 
                                        className={col.align === 'right' ? 'text-right' : ''}
                                        onClick={() => handleSort(col.key, col.sortable)}
                                        style={{ 
                                            cursor: col.sortable !== false ? 'pointer' : 'default',
                                            userSelect: 'none'
                                        }}
                                    >
                                        {col.label}
                                        <SortIcon columnKey={col.key} sortable={col.sortable} />
                                    </th>
                                ))}
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableLoading colSpan={columns.length + 1} />
                            ) : (
                                <>
                                    {data.map(item => (
                                        <tr key={item.id}>
                                            {columns.map((col, idx) => (
                                                <td key={col.key} className={col.align === 'right' ? 'text-right' : ''} style={col.style}>
                                                    {idx === 0 ? (
                                                        <Link to={`${basePath}/${item.id}`} style={{ fontWeight: 500, color: 'var(--primary)' }}>
                                                            {col.render ? col.render(item[col.key], item) : item[col.key]}
                                                        </Link>
                                                    ) : (
                                                        col.render ? col.render(item[col.key], item) : item[col.key]
                                                    )}
                                                </td>
                                            ))}
                                            <td className="text-right">
                                                <Link 
                                                    to={`${basePath}/${item.id}/edit`} 
                                                    className="btn btn-outline" 
                                                    style={{ fontSize: '0.7rem', padding: '4px 8px', marginRight: 8 }}
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.7rem', padding: '4px 8px', color: '#ef4444', borderColor: '#ef4444' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                                                {search ? `No matching ${itemName} found.` : (emptyMessage || `No ${itemName} found. Create one to get started.`)}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                        <button
                            onClick={handleBtnClick(() => setCurrentPage(1))}
                            disabled={currentPage === 1}
                            style={currentPage === 1 ? btnDisabledStyle : btnStyle}
                        >
                            ««
                        </button>
                        <button
                            onClick={handleBtnClick(() => setCurrentPage(p => Math.max(1, p - 1)))}
                            disabled={currentPage === 1}
                            style={currentPage === 1 ? btnDisabledStyle : btnStyle}
                        >
                            «
                        </button>
                        
                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={handleBtnClick(() => setCurrentPage(page))}
                                style={currentPage === page ? btnActiveStyle : btnStyle}
                            >
                                {page}
                            </button>
                        ))}
                        
                        <button
                            onClick={handleBtnClick(() => setCurrentPage(p => Math.min(totalPages, p + 1)))}
                            disabled={currentPage === totalPages}
                            style={currentPage === totalPages ? btnDisabledStyle : btnStyle}
                        >
                            »
                        </button>
                        <button
                            onClick={handleBtnClick(() => setCurrentPage(totalPages))}
                            disabled={currentPage === totalPages}
                            style={currentPage === totalPages ? btnDisabledStyle : btnStyle}
                        >
                            »»
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
