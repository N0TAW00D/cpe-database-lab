// Customer list page
import React from "react";
import { listCustomers, deleteCustomer } from "../../api/customers.api.js";
import { formatBaht } from "../../utils.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal, AlertModal } from "../../components/Modal.jsx";

export default function CustomerList() {
    const fetchData = React.useCallback((params) => listCustomers(params), []);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, force: false });
    const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
    const pendingDeleteRef = React.useRef(null);

    const closeConfirm = React.useCallback(() => {
        setConfirmModal({ isOpen: false, id: null, force: false });
        if (pendingDeleteRef.current) {
            pendingDeleteRef.current(false);
            pendingDeleteRef.current = null;
        }
    }, []);

    const handleDelete = (id) => {
        // Return a promise so DataList can wait until user confirms/cancels.
        return new Promise((resolve) => {
            pendingDeleteRef.current = resolve;
            setConfirmModal({ isOpen: true, id, force: false });
        });
    };

    const confirmDelete = async () => {
        try {
            await deleteCustomer(confirmModal.id, confirmModal.force);
            setConfirmModal({ isOpen: false, id: null, force: false });
            if (pendingDeleteRef.current) {
                pendingDeleteRef.current(true);
                pendingDeleteRef.current = null;
            }
        } catch (e) {
            const msg = String(e.message || e);
            if (msg.includes("Cannot delete customer because they have existing invoices")) {
                setConfirmModal({ isOpen: true, id: confirmModal.id, force: true });
            } else {
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
                onDelete={handleDelete}
            />
        </>
    );
}
