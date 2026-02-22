// Line items table: add/remove/reorder rows, insert row between. Drag-and-drop and up/down buttons.
// Each row is a separate component (LineItemRow.jsx) for easier reading.
import React, { useState } from "react";
import { toast } from "react-toastify";
import { formatBaht } from "../utils.js";
import { getProduct } from "../api/products.api.js";
import ProductPickerModal from "./ProductPickerModal.jsx";
import LineItemRow from "./LineItemRow.jsx";

export default function LineItemsEditor({ value, onChange }) {
    const items = value;
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [pickerRowIndex, setPickerRowIndex] = useState(0);
    const [productErrorRow, setProductErrorRow] = useState(null); // row index that has "product not found"

    // Update one row by index
    function update(i, patch) {
        const next = items.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
        onChange(next);
    }

    // Add a new row with empty product (user must select) at the end
    function addRow() {
        onChange([
            ...items,
            { product_code: "", product_name: "", quantity: 1, unit_price: 0 },
        ]);
    }

    // Insert a new empty row after index i (add row in between)
    function insertRowAfter(i) {
        const newRow = { product_code: "", product_name: "", quantity: 1, unit_price: 0 };
        const next = [...items.slice(0, i + 1), newRow, ...items.slice(i + 1)];
        onChange(next);
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

    function onPickProduct(i, productCode, productData) {
        setProductErrorRow(null);
        if (!productData) {
            update(i, { product_code: "", product_name: "", product_label: "", units_code: "", unit_price: 0 });
            return;
        }

        const existingIndex = items.findIndex((it, idx) => idx !== i && String(it.product_code) === String(productData.code));
        if (existingIndex !== -1) {
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
                product_code: productData.code,
                product_name: productData.name ?? "",
                product_label: productData.label,
                units_code: productData.units_code,
                unit_price: Number(productData.unit_price || 0)
            });
        }
    }

    function handleProductCodeBlur(i) {
        const code = String(items[i]?.product_code ?? "").trim();
        setProductErrorRow(null);
        if (!code) return;
        getProduct(code)
            .then((p) => {
                update(i, {
                    product_code: p.code,
                    product_name: p.name ?? "",
                    product_label: `${p.code} - ${p.name}`,
                    units_code: p.units_code ?? "",
                    unit_price: Number(p.unit_price ?? 0)
                });
            })
            .catch(() => {
                update(i, { product_name: "", product_label: "", units_code: "", unit_price: 0 });
                setProductErrorRow(i);
                toast.error(`Product not found: ${code}`);
            });
    }

    function computeExtended(it) {
        const q = Number(it.quantity || 0);
        const up = Number(it.unit_price || 0);
        return q * up;
    }

    const total = items.reduce((s, it) => s + computeExtended(it), 0);

    return (
        <div className="card">
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)'
            }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Line Items</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                            <th style={{ width: '18%' }}>Product Code <span className="required-marker">*</span></th>
                            <th style={{ width: '22%' }}>Product Name</th>
                            <th style={{ width: '8%' }} className="text-center">Unit</th>
                            <th style={{ width: '10%' }} className="text-right">Qty <span className="required-marker">*</span></th>
                            <th style={{ width: '12%' }} className="text-right">Unit Price <span className="required-marker">*</span></th>
                            <th style={{ width: '12%' }} className="text-right">Extended</th>
                            <th style={{ width: '100px' }} className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => (
                            <LineItemRow
                                key={i}
                                index={i}
                                item={it}
                                itemsLength={items.length}
                                update={update}
                                removeRow={removeRow}
                                moveUp={moveUp}
                                moveDown={moveDown}
                                insertRowAfter={insertRowAfter}
                                isDragging={dragIndex === i}
                                isDragOver={dragOverIndex === i && dragIndex !== i}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                productErrorRow={productErrorRow}
                                setProductErrorRow={setProductErrorRow}
                                onPickProduct={onPickProduct}
                                onOpenPicker={(idx) => { setPickerRowIndex(idx); setProductPickerOpen(true); }}
                                onProductCodeBlur={handleProductCodeBlur}
                                formatBaht={formatBaht}
                                computeExtended={computeExtended}
                            />
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ 
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

            <ProductPickerModal
                isOpen={productPickerOpen}
                onClose={() => setProductPickerOpen(false)}
                initialSearch={items[pickerRowIndex]?.product_code ?? ""}
                onSelect={(row) => {
                    const productData = {
                        code: row.code,
                        name: row.name,
                        label: `${row.code} - ${row.name}`,
                        units_code: row.units_code,
                        unit_price: Number(row.unit_price || 0),
                    };
                    onPickProduct(pickerRowIndex, row.code, productData);
                }}
            />
        </div>
    );
}
