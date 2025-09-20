import React from "react";

type ButtonColor = "primary" | "primary-outline";
type ButtonSize = "base" | "small" | "extra-small" | "large" | "extra-large";

interface ButtonProps {
  overwriteIcon?: React.ReactNode;
  iconURL?: string;
  onClick: () => void;
  title: string;
  subtitle: string;
  badgeText?: string; // Badge text (max 6 chars)
}

const Tile: React.FC<ButtonProps> = ({
  title,
  subtitle,
  iconURL = "#",
  overwriteIcon = undefined,
  onClick,
  badgeText,
}) => {
  // cap badge text to 6 chars
  const trimmedBadge = badgeText && badgeText.length > 6 ? badgeText.slice(0, 6) + "…" : badgeText;

  return (
    <li
      onClick={onClick}
      className="relative group cursor-pointer rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl shadow-md px-6 py-8 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 list-none"
    >
      {/* Star Badge in top-right */}
      {trimmedBadge && (
        <div className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-[10px] font-bold text-white">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
            <path
              d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.402 8.175L12 18.896l-7.336 3.854 1.402-8.175L.132 9.21l8.2-1.192L12 .587z"
              fill="#6366F1" // Indigo-500 (bright)
              stroke="white" // White thin stroke
              strokeWidth="0.4"
            />
          </svg>
          <span className="relative z-10">{trimmedBadge}</span>
        </div>
      )}

      <div className="mx-auto h-12 w-12 mb-4 p-2 bg-gradient-to-br from-indigo-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl group-hover:from-indigo-100 group-hover:to-indigo-100 dark:group-hover:from-gray-600 dark:group-hover:to-gray-500 transition-colors duration-300">
        {overwriteIcon !== undefined && overwriteIcon}
        {!overwriteIcon && (
          <img
            src={iconURL}
            alt=""
            className="h-8 w-8 mx-auto filter group-hover:brightness-110 transition-all duration-300"
          />
        )}
      </div>

      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1 text-center">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3 text-center">{subtitle}</p>
    </li>
  );
};

export default Tile;
