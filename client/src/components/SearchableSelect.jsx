import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SearchableSelect({ 
    options: staticOptions = [],
    onSearch,
    value, 
    onChange, 
    placeholder = "Search...",
    disabled = false,
    style = {},
    error = false,
    selectedLabel = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const [asyncOptions, setAsyncOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const debouncedSearch = useDebounce(search, 300);
    const isAsyncMode = typeof onSearch === 'function';
    const options = isAsyncMode ? asyncOptions : staticOptions;
    const selectedOption = staticOptions.find(opt => String(opt.value) === String(value));
    const displayLabel = selectedLabel || selectedOption?.label || "";

    useEffect(() => {
        if (!isAsyncMode || !isOpen) return;
        setLoading(true);
        onSearch(debouncedSearch)
            .then(results => {
                setAsyncOptions(results || []);
                setLoading(false);
            })
            .catch(() => {
                setAsyncOptions([]);
                setLoading(false);
            });
    }, [debouncedSearch, isOpen, isAsyncMode]);

    const filteredOptions = isAsyncMode 
        ? options 
        : options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function updatePosition() {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownPos({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        }
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                const dropdown = document.getElementById("searchable-select-dropdown");
                if (dropdown && dropdown.contains(e.target)) return;
                setIsOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(opt) {
        onChange(opt.value, opt.label, opt);
        setIsOpen(false);
        setSearch("");
    }

    function handleFocus() {
        if (!disabled) {
            setIsOpen(true);
            setSearch("");
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
            inputRef.current?.blur();
        } else if (e.key === "Enter" && filteredOptions.length > 0) {
            e.preventDefault();
            handleSelect(filteredOptions[0]);
        }
    }

    function handleClear(e) {
        e.stopPropagation();
        onChange("", "", null);
        setSearch("");
        inputRef.current?.focus();
    }

    const containerStyle = { position: "relative", width: "100%", ...style };

    const inputStyle = {
        width: "100%",
        padding: "8px 32px 8px 12px",
        fontSize: "0.9rem",
        border: `1px solid ${error ? '#ef4444' : 'var(--border, #ddd)'}`,
        borderRadius: "var(--radius-sm, 4px)",
        background: disabled ? "#f5f5f5" : "var(--bg-body, #fff)",
        cursor: disabled ? "not-allowed" : "text",
        boxShadow: error ? '0 0 0 1px #ef4444' : undefined,
        outline: "none"
    };

    const dropdownStyle = {
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "4px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        maxHeight: 220,
        overflowY: "auto",
        zIndex: 99999
    };

    const optionStyle = {
        padding: "10px 12px",
        cursor: "pointer",
        fontSize: "0.9rem",
        borderBottom: "1px solid #eee",
        background: "#fff"
    };

    const clearBtnStyle = {
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        color: "#999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    };

    const dropdownPortal = isOpen ? createPortal(
        <div id="searchable-select-dropdown" style={dropdownStyle}>
            {loading ? (
                <div style={{ padding: "12px", color: "#999", textAlign: "center", fontSize: "0.85rem" }}>
                    Loading...
                </div>
            ) : filteredOptions.length === 0 ? (
                <div style={{ padding: "12px", color: "#999", textAlign: "center", fontSize: "0.85rem" }}>
                    {search ? "No results found" : "Type to search..."}
                </div>
            ) : (
                filteredOptions.map((opt) => (
                    <div
                        key={opt.value}
                        onClick={() => handleSelect(opt)}
                        style={optionStyle}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                        {opt.label}
                    </div>
                ))
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div ref={containerRef} style={containerStyle}>
            <div style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? search : displayLabel}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={inputStyle}
                />
                {value && !disabled && (
                    <button type="button" onClick={handleClear} style={clearBtnStyle} title="Clear">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                {!value && !disabled && (
                    <span style={{ ...clearBtnStyle, cursor: "default", color: "#bbb" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </span>
                )}
            </div>
            {dropdownPortal}
        </div>
    );
}
