import React from "react";

type ButtonColor =
  | "primary"
  | "primary-outline"
  | "success"
  | "success-outline"
  | "danger"
  | "danger-outline"
  | "secondary"
  | "secondary-outline"
  | "warning"
  | "warning-outline"
  | "info"
  | "info-outline";
type ButtonSize = "base" | "small" | "extra-small" | "large" | "extra-large";

interface ButtonProps {
  label: string;
  onClick: () => void;
  color: ButtonColor;
  size?: ButtonSize;
  disabled?: boolean;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  buttonBlock?: boolean;
  marginClass?: string; // <-- NEW prop for custom margins
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  color = "primary",
  size = "base",
  disabled = false,
  type = "button",
  buttonBlock = false,
  marginClass = "me-2 mb-2", // <-- Default margins (same as before)
}) => {
  const baseStyles =
    "rounded-lg text-center font-medium cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const colorStyles: Record<ButtonColor, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    "primary-outline":
      "text-indigo-700 hover:text-white border border-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg dark:border-indigo-500 dark:text-indigo-500 dark:hover:text-white dark:hover:bg-indigo-500 dark:focus:ring-indigo-800",

    success: "bg-green-600 text-white hover:bg-green-700",
    "success-outline":
      "text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-500 dark:focus:ring-green-800",

    danger: "bg-red-600 text-white hover:bg-red-700",
    "danger-outline":
      "text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-500 dark:focus:ring-red-800",

    secondary:
      "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300",
    "secondary-outline":
      "text-slate-800 hover:text-white border border-slate-800 hover:bg-slate-900 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg dark:border-slate-200 dark:text-slate-200 dark:hover:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-800",

    warning: "bg-amber-500 text-white hover:bg-amber-600",
    "warning-outline":
      "text-amber-700 hover:text-white border border-amber-700 hover:bg-amber-800 focus:ring-4 focus:outline-none focus:ring-amber-300 font-medium rounded-lg dark:border-amber-500 dark:text-amber-500 dark:hover:text-white dark:hover:bg-amber-500 dark:focus:ring-amber-800",

    info: "bg-sky-600 text-white hover:bg-sky-700",
    "info-outline":
      "text-sky-700 hover:text-white border border-sky-700 hover:bg-sky-800 focus:ring-4 focus:outline-none focus:ring-sky-300 font-medium rounded-lg dark:border-sky-500 dark:text-sky-500 dark:hover:text-white dark:hover:bg-sky-500 dark:focus:ring-sky-800",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    base: "px-5 py-2.5 text-sm ",
    small: "px-3 py-2 text-sm",
    "extra-small": "px-3 py-2 text-xs",
    large: "px-5 py-3 text-base",
    "extra-large": "px-6 py-3.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${colorStyles[color]} ${sizeStyles[size]} ${buttonBlock ? "w-full" : ""} ${marginClass}`}
    >
      {label}
    </button>
  );
};

export default Button;
