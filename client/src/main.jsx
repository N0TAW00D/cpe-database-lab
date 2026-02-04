// App entry: mounts React, sets up routes and main layout
// Example usage: visit `/invoices` to see the invoice list
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import InvoiceList from "./pages/invoices/InvoiceList.jsx";
import InvoicePage from "./pages/invoices/InvoicePage.jsx";
import CustomerList from "./pages/customers/CustomerList.jsx";
import CustomerPage from "./pages/customers/CustomerPage.jsx";
import ProductList from "./pages/products/ProductList.jsx";
import ProductPage from "./pages/products/ProductPage.jsx";
import Reports from "./pages/reports/Reports.jsx";
import "./index.css";

// Left navigation sidebar (เมนูหลักของระบบ)
function Sidebar() {
  const getLinkClass = ({ isActive }) => isActive ? "nav-item active" : "nav-item";

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          InvoiceDoc v2
        </div>
      </div>
      <nav className="sidebar-nav">
        {/* Example: click to open invoice list page */}
        <NavLink to="/invoices" className={getLinkClass}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Invoices
        </NavLink>
        <NavLink to="/customers" className={getLinkClass}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Customers
        </NavLink>
        <NavLink to="/products" className={getLinkClass}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Products
        </NavLink>
        <NavLink to="/reports" className={getLinkClass}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          Reports
        </NavLink>
      </nav>
    </aside>
  );
}

// Page layout wrapper (sidebar + main content)
// Example usage: <Layout><InvoiceList /></Layout>
function Layout({ children }) {
  return (
    <div className="layout-container">
      <div className="top-banner no-print">
        This is a sample term project for CPE241 Database Systems. Some functions may be incomplete. Click
        <a href="https://google.com" target="_blank" rel="noreferrer">here for questions</a>
      </div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}

// App router definitions (define page URLs)
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default route → invoices list */}
        <Route path="/" element={<Navigate to="/invoices" replace />} />
        <Route path="/invoices" element={<Layout><InvoiceList /></Layout>} />
        <Route path="/invoices/new" element={<Layout><InvoicePage mode="create" /></Layout>} />
        <Route path="/invoices/:id" element={<Layout><InvoicePage mode="view" /></Layout>} />
        <Route path="/invoices/:id/edit" element={<Layout><InvoicePage mode="edit" /></Layout>} />
        <Route path="/customers" element={<Layout><CustomerList /></Layout>} />
        <Route path="/customers/new" element={<Layout><CustomerPage mode="create" /></Layout>} />
        <Route path="/customers/:id" element={<Layout><CustomerPage mode="view" /></Layout>} />
        <Route path="/customers/:id/edit" element={<Layout><CustomerPage mode="edit" /></Layout>} />
        <Route path="/products" element={<Layout><ProductList /></Layout>} />
        <Route path="/products/new" element={<Layout><ProductPage mode="create" /></Layout>} />
        <Route path="/products/:id" element={<Layout><ProductPage mode="view" /></Layout>} />
        <Route path="/products/:id/edit" element={<Layout><ProductPage mode="edit" /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
