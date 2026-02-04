// Customer list page
import React from "react";
import { listCustomers, deleteCustomer } from "../../api/customers.api.js";
import { formatBaht } from "../../utils.js";
import DataList from "../../components/DataList.jsx";

export default function CustomerList() {
    const fetchData = React.useCallback((params) => listCustomers(params), []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            await deleteCustomer(id);
        } catch (e) {
            const msg = String(e.message || e);
            if (msg.includes("Cannot delete customer because they have existing invoices")) {
                if (window.confirm("This customer has invoices. Do you want to delete the customer AND all their invoices?")) {
                    try {
                        await deleteCustomer(id, true);
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
        { 
            key: "address_line1", 
            label: "Address", 
            style: { color: 'var(--text-muted)' },
            render: (v, row) => `${v || "-"}${row.address_line2 ? `, ${row.address_line2}` : ""}`
        },
        { key: "credit_limit", label: "Credit Limit", align: "right", render: v => <span className="font-bold">{v ? formatBaht(v) : "-"}</span> }
    ];

    return (
        <DataList
            title="Customers"
            fetchData={fetchData}
            columns={columns}
            searchPlaceholder="Search code, name, address..."
            itemName="customers"
            basePath="/customers"
            onDelete={handleDelete}
        />
    );
}
