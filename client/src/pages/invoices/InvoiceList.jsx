// Invoice list: click Delete → show confirm modal → call delete API → refresh table via refreshTrigger
import React from "react";
import { toast } from "react-toastify";
import { listInvoices, deleteInvoice } from "../../api/invoices.api.js";
import { formatBaht, formatDate } from "../../utils.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal, AlertModal } from "../../components/Modal.jsx";

export default function InvoiceList() {
    const fetchData = React.useCallback((params) => listInvoices(params), []);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null });
    const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const closeConfirm = () => setConfirmModal({ isOpen: false, id: null });

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteInvoice(confirmModal.id);
            closeConfirm();
            setRefreshTrigger((t) => t + 1);
            toast.success("Invoice deleted.");
        } catch (e) {
            const msg = String(e.message || e);
            toast.error(msg);
            setAlertModal({ isOpen: true, message: "Error: " + msg });
            closeConfirm();
        }
    };

    const columns = [
        { key: "invoice_no", label: "Invoice No" },
        { key: "customer_name", label: "Customer" },
        { key: "invoice_date", label: "Date", render: v => formatDate(v) },
        { key: "amount_due", label: "Amount Due", align: "right", render: v => <span className="font-bold">{formatBaht(v)}</span> }
    ];

    return (
        <>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDelete}
                closeOnConfirm={false}
                title="Delete Invoice"
                message="Are you sure you want to delete this invoice?"
                confirmText="Delete"
            />
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: "" })}
                title="Error"
                message={alertModal.message}
            />
            <DataList
                refreshTrigger={refreshTrigger}
                title="Invoices"
                fetchData={fetchData}
                columns={columns}
                searchPlaceholder="Search invoice no, customer..."
                itemName="invoices"
                basePath="/invoices"
                itemKey="invoice_no"
                onDelete={handleDelete}
            />
        </>
    );
}
