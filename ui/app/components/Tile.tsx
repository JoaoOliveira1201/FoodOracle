import React from "react";

type ButtonColor = "primary" | "primary-outline";
type ButtonSize = "base" | "small" | "extra-small" | "large" | "extra-large";

interface ButtonProps {
  overwriteIcon?: React.ReactNode;
  iconURL?: string;
  onClick: () => void;
  title: string;
  subtitle: string;
}

const Tile: React.FC<ButtonProps> = ({ title, subtitle, iconURL = "#", overwriteIcon = undefined, onClick }) => {
  return (
    <li
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl shadow-md px-6 py-8 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 list-none"
    >
      <div className="mx-auto h-12 w-12 mb-4 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-gray-600 dark:group-hover:to-gray-500 transition-colors duration-300">
        {overwriteIcon !== undefined && overwriteIcon}
        {!overwriteIcon && (
          <img 
            src={iconURL} 
            alt="" 
            className="h-8 w-8 mx-auto filter group-hover:brightness-110 transition-all duration-300"
          />
        )}
      </div>
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1 text-center">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3 text-center">
        {subtitle}
      </p>
    </li>
  );
};

export default Tile;
