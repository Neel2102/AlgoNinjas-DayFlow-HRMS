import React from "react";

const Table = ({ className = "", children, ...props }) => {
  return (
    <div className={["ui-table-wrap", className].filter(Boolean).join(" ")}>
      <table className="ui-table" {...props}>
        {children}
      </table>
    </div>
  );
};

export default Table;
