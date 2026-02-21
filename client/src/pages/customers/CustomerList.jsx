// Customer list: click Delete → show confirm modal → call delete API → refresh table via refreshTrigger
import React from "react";
import { toast } from "react-toastify";
import { listCustomers, deleteCustomer } from "../../api/customers.api.js";
import { formatBaht } from "../../utils.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal, AlertModal } from "../../components/Modal.jsx";

export default function CustomerList() {
    const fetchData = React.useCallback((params) => listCustomers(params), []);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, force: false });
    const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const closeConfirm = () => setConfirmModal({ isOpen: false, id: null, force: false });

    // DataList calls this when user clicks Delete; we only open the modal
    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id, force: false });
    };

    // When user confirms in modal: call delete API, then increment refreshTrigger so the table refetches
    const confirmDelete = async () => {
        try {
            await deleteCustomer(confirmModal.id, confirmModal.force);
            closeConfirm();
            setRefreshTrigger((t) => t + 1);
            toast.success(confirmModal.force ? "Customer and related invoices deleted." : "Customer deleted.");
        } catch (e) {
            const msg = String(e.message || e);
            if (msg.includes("Cannot delete customer because they have existing invoices")) {
                setConfirmModal({ isOpen: true, id: confirmModal.id, force: true });
            } else {
                toast.error(msg);
                setAlertModal({ isOpen: true, message: "Error: " + msg });
                closeConfirm();
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
        <>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDelete}
                closeOnConfirm={false}
                title="Delete Customer"
                message={confirmModal.force 
                    ? "This customer has invoices. Do you want to delete the customer AND all their invoices?"
                    : "Are you sure you want to delete this customer?"}
                confirmText="Delete"
            />
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: "" })}
                title="Error"
                message={alertModal.message}
            />
            <DataList
                title="Customers"
                fetchData={fetchData}
                columns={columns}
                searchPlaceholder="Search code, name, address..."
                itemName="customers"
                basePath="/customers"
                itemKey="code"
                onDelete={handleDelete}
                refreshTrigger={refreshTrigger}
            />
        </>
    );
}
