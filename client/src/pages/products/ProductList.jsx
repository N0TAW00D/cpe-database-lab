// Product list: click Delete → show confirm modal → call delete API → refresh table via refreshTrigger
import React from "react";
import { toast } from "react-toastify";
import { listProducts, deleteProduct } from "../../api/products.api.js";
import { formatBaht } from "../../utils.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal, AlertModal } from "../../components/Modal.jsx";

export default function ProductList() {
    const fetchData = React.useCallback((params) => listProducts(params), []);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null, force: false });
    const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const closeConfirm = () => setConfirmModal({ isOpen: false, id: null, force: false });

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id, force: false });
    };

    const confirmDelete = async () => {
        try {
            await deleteProduct(confirmModal.id, confirmModal.force);
            closeConfirm();
            setRefreshTrigger((t) => t + 1);
            toast.success(confirmModal.force ? "Product and related invoices deleted." : "Product deleted.");
        } catch (e) {
            const msg = String(e.message || e);
            if (msg.includes("Cannot delete product because it is used in invoices")) {
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
        { key: "units_code", label: "Unit" },
        { key: "unit_price", label: "Unit Price", align: "right", render: v => <span className="font-bold">{formatBaht(v)}</span> }
    ];

    return (
        <>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDelete}
                closeOnConfirm={false}
                title="Delete Product"
                message={confirmModal.force 
                    ? "This product is used in invoices. Do you want to delete the product AND all related invoices?"
                    : "Are you sure you want to delete this product?"}
                confirmText="Delete"
            />
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: "" })}
                title="Error"
                message={alertModal.message}
            />
            <DataList
                title="Products"
                fetchData={fetchData}
                columns={columns}
                searchPlaceholder="Search code, name, unit..."
                itemName="products"
                basePath="/products"
                itemKey="code"
                onDelete={handleDelete}
                refreshTrigger={refreshTrigger}
            />
        </>
    );
}
