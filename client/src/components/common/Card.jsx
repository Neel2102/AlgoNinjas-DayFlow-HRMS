import React from "react";

const Card = ({ className = "", padded = true, children, ...props }) => {
  const padClass = padded ? "pad" : "";
  return (
    <div className={["ui-card", padClass, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
};

export default Card;
