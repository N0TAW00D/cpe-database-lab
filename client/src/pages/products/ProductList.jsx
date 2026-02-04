// Product list page
import React from "react";
import { listProducts, deleteProduct } from "../../api/products.api.js";
import { formatBaht } from "../../utils.js";
import DataList from "../../components/DataList.jsx";

export default function ProductList() {
    const fetchData = React.useCallback((params) => listProducts(params), []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
        } catch (e) {
            const msg = String(e.message || e);
            if (msg.includes("Cannot delete product because it is used in invoices")) {
                if (window.confirm("This product is used in invoices. Do you want to delete the product AND all related invoices?")) {
                    try {
                        await deleteProduct(id, true);
                    } catch (err) {
                        alert("Error: " + String(err.message || err));
                    }
                }
            } else {
                alert("Error: " + msg);
            }
        }
    };

    const columns = [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "units_code", label: "Unit" },
        { key: "unit_price", label: "Unit Price", align: "right", render: v => <span className="font-bold">{formatBaht(v)}</span> }
    ];

    return (
        <DataList
            title="Products"
            fetchData={fetchData}
            columns={columns}
            searchPlaceholder="Search code, name, unit..."
            itemName="products"
            basePath="/products"
            onDelete={handleDelete}
        />
    );
}
