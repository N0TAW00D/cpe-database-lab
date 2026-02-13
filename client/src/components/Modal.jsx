import React from "react";
import { createPortal } from "react-dom";

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 24
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto"
        }}
      >
        {title && (
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "var(--text-main)" }}>
              {title}
            </h3>
          </div>
        )}
        <div style={{ padding: "24px" }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Confirmation Modal Helper
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  closeOnConfirm = true
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) onClose();
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}

// Alert Modal Helper
export function AlertModal({ isOpen, onClose, title, message, buttonText = "OK" }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <button className="btn btn-primary" onClick={onClose}>
          {buttonText}
        </button>
      }
    >
      <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}
