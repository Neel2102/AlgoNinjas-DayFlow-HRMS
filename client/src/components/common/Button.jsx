import React from "react";

const Button = ({
  variant = "default",
  className = "",
  type = "button",
  disabled = false,
  onClick,
  children,
  ...props
}) => {
  const base = "ui-btn";
  const v =
    variant === "primary"
      ? "primary"
      : variant === "ghost"
        ? "ghost"
        : variant === "success"
          ? "success"
          : variant === "danger"
            ? "danger"
            : "";
  return (
    <button
      type={type}
      className={[base, v, className].filter(Boolean).join(" ")}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
