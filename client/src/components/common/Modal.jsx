import React, { useEffect } from "react";

const Modal = ({ title, open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal-overlay" onMouseDown={onClose}>
      <div className="ui-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ui-modal-head">
          <div className="ui-h2">{title}</div>
          <button className="ui-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
