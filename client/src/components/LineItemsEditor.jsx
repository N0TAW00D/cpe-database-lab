// Line items table editor (ตารางรายการสินค้าในใบแจ้งหนี้)
// Example usage: <LineItemsEditor searchProducts={async (q) => [...]} value={items} onChange={setItems} />
import React, { useState } from "react";
import { formatBaht } from "../utils.js";
import SearchableSelect from "./SearchableSelect.jsx";

export default function LineItemsEditor({ searchProducts, value, onChange }) {
    const items = value;
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Update one row by index
    function update(i, patch) {
        const next = items.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
        onChange(next);
    }

    // Add a new row with empty product (user must select)
    function addRow() {
        onChange([
            ...items,
            { product_id: "", quantity: 1, unit_price: 0 },
        ]);
    }

    // Remove a row by index
    function removeRow(i) {
        onChange(items.filter((_, idx) => idx !== i));
    }

    // Move item up
    function moveUp(i) {
        if (i <= 0) return;
        const newItems = [...items];
        [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
        onChange(newItems);
    }

    // Move item down
    function moveDown(i) {
        if (i >= items.length - 1) return;
        const newItems = [...items];
        [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
        onChange(newItems);
    }

    // Drag and drop handlers
    function handleDragStart(e, index) {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    }

    function handleDragLeave() {
        setDragOverIndex(null);
    }

    function handleDrop(e, dropIndex) {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        
        const newItems = [...items];
        const [removed] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIndex, 0, removed);
        onChange(newItems);
        
        setDragIndex(null);
        setDragOverIndex(null);
    }

    function handleDragEnd() {
        setDragIndex(null);
        setDragOverIndex(null);
    }

    function onPickProduct(i, productId, productData) {
        if (!productData) {
            update(i, { product_id: "", product_label: "", units_code: "", unit_price: 0 });
            return;
        }

        // Check if this product already exists in another row
        const existingIndex = items.findIndex((it, idx) => idx !== i && String(it.product_id) === String(productData.id));
        
        if (existingIndex !== -1) {
            // Merge: add quantity to existing row and remove current row
            const currentQty = Number(items[i].quantity || 1);
            const existingQty = Number(items[existingIndex].quantity || 0);
            const newItems = items.filter((_, idx) => idx !== i);
            newItems[existingIndex > i ? existingIndex - 1 : existingIndex] = {
                ...newItems[existingIndex > i ? existingIndex - 1 : existingIndex],
                quantity: existingQty + currentQty
            };
            onChange(newItems);
        } else {
            update(i, { 
                product_id: productData.id, 
                product_label: productData.label,
                units_code: productData.units_code,
                unit_price: Number(productData.unit_price || 0) 
            });
        }
    }

    // Compute extended price (qty * unit price)
    function computeExtended(it) {
        const q = Number(it.quantity || 0);
        const up = Number(it.unit_price || 0);
        return q * up;
    }

    const total = items.reduce((s, it) => s + computeExtended(it), 0);

    // Icon components
    const DragIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/>
            <circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/>
            <circle cx="15" cy="18" r="1.5"/>
        </svg>
    );

    const ArrowUpIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    );

    const ArrowDownIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );

    const actionBtnStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        borderRadius: 4,
        color: '#666',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const disabledBtnStyle = {
        ...actionBtnStyle,
        cursor: 'not-allowed',
        color: '#ddd'
    };

    return (
        <div className="card">
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border)'
            }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Line Items</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''} added • Drag to reorder
                    </span>
                </div>
                <button 
                    type="button" 
                    onClick={addRow} 
                    className="btn btn-primary"
                    style={{ padding: '8px 16px' }}
                >
                    <svg style={{ marginRight: 6 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Item
                </button>
            </div>

            <div className="table-container">
                <table className="modern-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }} className="text-center">#</th>
                            <th style={{ width: '35%' }}>Product</th>
                            <th style={{ width: '10%' }} className="text-center">Unit</th>
                            <th style={{ width: '12%' }} className="text-right">Qty</th>
                            <th style={{ width: '14%' }} className="text-right">Unit Price</th>
                            <th style={{ width: '14%' }} className="text-right">Extended</th>
                            <th style={{ width: '80px' }} className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => {
                            const isDragging = dragIndex === i;
                            const isDragOver = dragOverIndex === i && dragIndex !== i;
                            
                            return (
                                <tr 
                                    key={i}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, i)}
                                    onDragOver={(e) => handleDragOver(e, i)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, i)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        opacity: isDragging ? 0.5 : 1,
                                        background: isDragOver ? 'var(--primary-light, #e0f2fe)' : 'transparent',
                                        transition: 'background 0.15s, opacity 0.15s',
                                        cursor: 'grab'
                                    }}
                                >
                                    <td className="text-center">
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: 4,
                                            color: 'var(--text-muted)'
                                        }}>
                                            <span style={{ cursor: 'grab', color: '#aaa' }} title="Drag to reorder">
                                                <DragIcon />
                                            </span>
                                            <span style={{ 
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: 'var(--text-muted)',
                                                minWidth: 20
                                            }}>
                                                {i + 1}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <SearchableSelect
                                            onSearch={searchProducts}
                                            value={it.product_id}
                                            selectedLabel={it.product_label || ""}
                                            onChange={(val, label, data) => onPickProduct(i, val, data)}
                                            placeholder="Search product..."
                                            error={!it.product_id}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <span style={{ 
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            background: 'var(--bg-body)',
                                            borderRadius: 4,
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500
                                        }}>
                                            {it.units_code || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={it.quantity}
                                            onChange={(e) => update(i, { quantity: e.target.value })}
                                            className="form-control"
                                            style={{ 
                                                textAlign: 'right',
                                                padding: '8px 12px',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ 
                                            textAlign: 'right',
                                            padding: '8px 12px',
                                            background: 'var(--bg-body)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.9rem'
                                        }}>
                                            {formatBaht(it.unit_price)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            color: 'var(--primary)',
                                            fontSize: '0.95rem'
                                        }}>
                                            {formatBaht(computeExtended(it))}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: 2
                                        }}>
                                            {/* Move Up */}
                                            <button 
                                                type="button" 
                                                onClick={() => moveUp(i)} 
                                                disabled={i === 0}
                                                style={i === 0 ? disabledBtnStyle : actionBtnStyle}
                                                title="Move up"
                                            >
                                                <ArrowUpIcon />
                                            </button>
                                            
                                            {/* Move Down */}
                                            <button 
                                                type="button" 
                                                onClick={() => moveDown(i)} 
                                                disabled={i === items.length - 1}
                                                style={i === items.length - 1 ? disabledBtnStyle : actionBtnStyle}
                                                title="Move down"
                                            >
                                                <ArrowDownIcon />
                                            </button>
                                            
                                            {/* Remove */}
                                            <button 
                                                type="button" 
                                                onClick={() => removeRow(i)} 
                                                disabled={items.length <= 1}
                                                style={{
                                                    ...actionBtnStyle,
                                                    color: items.length <= 1 ? '#ddd' : '#ef4444',
                                                    cursor: items.length <= 1 ? 'not-allowed' : 'pointer'
                                                }}
                                                title="Remove item"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ 
                                    padding: 40, 
                                    textAlign: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    <svg style={{ marginBottom: 12, opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    </svg>
                                    <div>No items added yet</div>
                                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Click "Add Item" to start</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Subtotal Footer */}
            {items.length > 0 && (
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '2px solid var(--border)'
                }}>
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                        padding: '12px 20px',
                        background: 'var(--bg-body)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        <span style={{ 
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)'
                        }}>
                            Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})
                        </span>
                        <span style={{ 
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--primary)'
                        }}>
                            {formatBaht(total)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
