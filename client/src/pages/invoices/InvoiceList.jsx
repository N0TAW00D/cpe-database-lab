// Invoice list page
import React from "react";
import { listInvoices, deleteInvoice } from "../../api/invoices.api.js";
import { formatBaht, formatDate } from "../../utils.js";
import DataList from "../../components/DataList.jsx";

export default function InvoiceList() {
    const fetchData = React.useCallback((params) => listInvoices(params), []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteInvoice(id);
        } catch (e) {
            alert("Error: " + String(e.message || e));
        }
    };

    const columns = [
        { key: "invoice_no", label: "Invoice No" },
        { key: "customer_name", label: "Customer" },
        { key: "invoice_date", label: "Date", render: v => formatDate(v) },
        { key: "amount_due", label: "Amount Due", align: "right", render: v => <span className="font-bold">{formatBaht(v)}</span> }
    ];

    return (
        <DataList
            title="Invoices"
            fetchData={fetchData}
            columns={columns}
            searchPlaceholder="Search invoice no, customer..."
            itemName="invoices"
            basePath="/invoices"
            onDelete={handleDelete}
        />
    );
}
