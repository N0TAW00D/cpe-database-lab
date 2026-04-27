// App entry: defines which URL path renders which page (routes)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InvoiceList from "./pages/invoices/InvoiceList.jsx";
import InvoicePage from "./pages/invoices/InvoicePage.jsx";
import ReceiptList from "./pages/receipts/ReceiptList.jsx";
import ReceiptPage from "./pages/receipts/ReceiptPage.jsx";
import CustomerList from "./pages/customers/CustomerList.jsx";
import CustomerPage from "./pages/customers/CustomerPage.jsx";
import ProductList from "./pages/products/ProductList.jsx";
import ProductPage from "./pages/products/ProductPage.jsx";
import Reports from "./pages/reports/Reports.jsx";
import { http } from "./api/http.js";
import "./index.css";
import SalesPersonList from "./pages/sales-person/SalesPersonList.jsx";
import SalesPersonPage from "./pages/sales-person/SalesPersonPage.jsx";

// Collapsible submenu (e.g. Reports → Product Sales, Monthly Sales)
function SubMenu({ icon, label, children, basePath }) {
  const location = window.location.pathname;
  const isActive = location.startsWith(basePath);
  const [isOpen, setIsOpen] = React.useState(isActive);

  return (
    <div className={`nav-group ${isOpen ? 'open' : ''}`}>
      <button 
        type="button" 
        className={`nav-item nav-group-toggle ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        <svg 
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div className="nav-submenu" style={{ display: isOpen ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

function Sidebar() {
  // NavLink injects isActive when the current URL matches this link
  const getLinkClass = ({ isActive }) => isActive ? "nav-item active" : "nav-item";
  const getSubLinkClass = ({ isActive }) => isActive ? "nav-subitem active" : "nav-subitem";

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
        <NavLink to="/invoices" className={getLinkClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Invoices
        </NavLink>
        <NavLink to="/receipts" className={getLinkClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path><path d="M8 10h8"></path><path d="M8 14h8"></path><path d="M8 6h8"></path></svg>
          Receipts
        </NavLink>
        <NavLink to="/sales-person" className={getLinkClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Sales Person
        </NavLink>
        <NavLink to="/customers" className={getLinkClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Customers
        </NavLink>
        <NavLink to="/products" className={getLinkClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Products
        </NavLink>
        
        <SubMenu 
          basePath="/reports"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>}
          label="Reports"
        >
          <NavLink to="/reports/product-sales" className={getSubLinkClass}>
            Product Sales
          </NavLink>
          <NavLink to="/reports/monthly-sales" className={getSubLinkClass}>
            Monthly Sales
          </NavLink>
          <NavLink to="/reports/customer-sales" className={getSubLinkClass}>
            Customer Buying
          </NavLink>
          <NavLink to="/reports/receipt-list" className={getSubLinkClass}>
            List of Receipts
          </NavLink>
          <NavLink to="/reports/invoice-receipts" className={getSubLinkClass}>
            Invoice & Receipts
          </NavLink>
        </SubMenu>
      </nav>
    </aside>
  );
}

// Banner when repo has newer commits (server returns updateAvailable if GIT_SHA is set and behind GitHub)
function UpdateBanner() {
  const [show, setShow] = React.useState(false);
  const [repoUrl, setRepoUrl] = React.useState("");
  const DISMISS_KEY = "invoicedoc2-update-banner-dismissed";

  React.useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    http("/api/updates-check")
      .then((data) => {
        if (data.updateAvailable && data.repoUrl) {
          setShow(true);
          setRepoUrl(data.repoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="update-banner no-print">
      <span>
        Update available: the repo has new changes — run <code>git pull origin</code> in your project folder to get the latest, or check{" "}
        <a href={repoUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </span>
      <button type="button" className="update-banner-dismiss" onClick={dismiss} aria-label="Close">
        ×
      </button>
    </div>
  );
}

// Mobile warning overlay
function MobileWarning() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  
  return (
    <div className="mobile-warning">
      <div className="mobile-warning-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
        <h3>Whoa there! 📱</h3>
        <p>TA was too busy touching grass to make this mobile-friendly.<br/>Please grab a laptop. We believe in you.</p>
        <button className="btn btn-primary" onClick={() => setDismissed(true)}>
          Okay, I'll suffer
        </button>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="layout-container">
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} theme="light" />
      <MobileWarning />
      <UpdateBanner />
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

// Route definitions: path → component (e.g. /invoices → InvoiceList)
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
        <Route path="/receipts" element={<Layout><ReceiptList /></Layout>} />
        <Route path="/receipts/new" element={<Layout><ReceiptPage mode="create" /></Layout>} />
        <Route path="/receipts/:id" element={<Layout><ReceiptPage mode="view" /></Layout>} />
        <Route path="/receipts/:id/edit" element={<Layout><ReceiptPage mode="edit" /></Layout>} />
        <Route path="/customers" element={<Layout><CustomerList /></Layout>} />
        <Route path="/customers/new" element={<Layout><CustomerPage mode="create" /></Layout>} />
        <Route path="/customers/:id" element={<Layout><CustomerPage mode="view" /></Layout>} />
        <Route path="/customers/:id/edit" element={<Layout><CustomerPage mode="edit" /></Layout>} />
        <Route path="/products" element={<Layout><ProductList /></Layout>} />
        <Route path="/products/new" element={<Layout><ProductPage mode="create" /></Layout>} />
        <Route path="/products/:id" element={<Layout><ProductPage mode="view" /></Layout>} />
        <Route path="/products/:id/edit" element={<Layout><ProductPage mode="edit" /></Layout>} />
        <Route path="/reports" element={<Navigate to="/reports/product-sales" replace />} />
        <Route path="/reports/product-sales" element={<Layout><Reports type="product-sales" /></Layout>} />
        <Route path="/reports/monthly-sales" element={<Layout><Reports type="monthly-sales" /></Layout>} />
        <Route path="/reports/customer-sales" element={<Layout><Reports type="customer-sales" /></Layout>} />
        <Route path="/reports/receipt-list" element={<Layout><Reports type="receipt-list" /></Layout>} />
        <Route path="/reports/invoice-receipts" element={<Layout><Reports type="invoice-receipts" /></Layout>} />

        <Route path="/sales-person" element={<Layout><SalesPersonList /></Layout>} />
        <Route path="/sales-person/new" element={<Layout><SalesPersonPage mode="create" /></Layout>} />
        <Route path="/sales-person/:id" element={<Layout><SalesPersonPage mode="view" /></Layout>} />
        <Route path="/sales-person/:id/edit" element={<Layout><SalesPersonPage mode="edit" /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
