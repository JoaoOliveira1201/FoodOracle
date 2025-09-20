import { useNavigate } from "react-router";
import Tile from "~/components/Tile";

export function AdminSection() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          Analytics & Intelligence
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            badgeText="AI"
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M19.9992 20.9999H11.9992V7.99991M11.9992 7.99991C13.1038 7.99991 13.9992 7.10448 13.9992 5.99991C13.9992 5.75961 13.9568 5.5292 13.8792 5.31576M11.9992 7.99991C10.8947 7.99991 9.99923 7.10448 9.99923 5.99991C9.99923 4.89534 10.8947 3.99991 11.9992 3.99991C12.8635 3.99991 13.5997 4.54811 13.8792 5.31576M10.1203 6.68387L4.48214 8.73599M19.5172 3.26367L13.8792 5.31576M5.99923 20.9999C7.51177 20.9999 8.76287 20.1583 8.96934 18.7512C8.98242 18.662 8.98897 18.6174 8.98385 18.5185C8.98031 18.4502 8.95717 18.3255 8.93599 18.2604C8.90531 18.1663 8.86812 18.1002 8.79375 17.9679L5.99923 12.9999L3.2047 17.9679C3.13575 18.0905 3.10128 18.1518 3.06939 18.2583C3.04977 18.3238 3.02706 18.481 3.02735 18.5494C3.02781 18.6605 3.03453 18.6898 3.04799 18.7485C3.30295 19.8599 4.5273 20.9999 5.99923 20.9999ZM17.9992 16.9999C19.5118 16.9999 20.7629 16.1583 20.9693 14.7512C20.9824 14.662 20.989 14.6174 20.9838 14.5185C20.9803 14.4502 20.9572 14.3255 20.936 14.2604C20.9053 14.1663 20.8681 14.1002 20.7937 13.9679L17.9992 8.99991L15.2047 13.9679C15.1358 14.0905 15.1013 14.1518 15.0694 14.2583C15.0498 14.3238 15.0271 14.481 15.0273 14.5494C15.0278 14.6605 15.0345 14.6898 15.048 14.7485C15.303 15.8599 16.5273 16.9999 17.9992 16.9999Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/budgetAdvisorChatbot")}
            title="Smart Budget Advisor"
            subtitle="Optimize spending with AI-powered supplier comparisons and budget recommendations."
          />
          <Tile
            badgeText="AI"
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M18.5 18C18.5 19.1046 17.6046 20 16.5 20C15.3954 20 14.5 19.1046 14.5 18M18.5 18C18.5 16.8954 17.6046 16 16.5 16C15.3954 16 14.5 16.8954 14.5 18M18.5 18H21.5M14.5 18H13.5M8.5 18C8.5 19.1046 7.60457 20 6.5 20C5.39543 20 4.5 19.1046 4.5 18M8.5 18C8.5 16.8954 7.60457 16 6.5 16C5.39543 16 4.5 16.8954 4.5 18M8.5 18H13.5M4.5 18C3.39543 18 2.5 17.1046 2.5 16V7.2C2.5 6.0799 2.5 5.51984 2.71799 5.09202C2.90973 4.71569 3.21569 4.40973 3.59202 4.21799C4.01984 4 4.5799 4 5.7 4H10.3C11.4201 4 11.9802 4 12.408 4.21799C12.7843 4.40973 13.0903 4.71569 13.282 5.09202C13.5 5.51984 13.5 6.0799 13.5 7.2V18M13.5 18V8H17.5L20.5 12M20.5 12V18M20.5 12H13.5"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/transfer-suggestions")}
            title="Logistics Optimizer"
            subtitle="AI-powered planning to optimize truck routes and balance warehouse distribution."
          />
          <Tile
            badgeText="AI"
            overwriteIcon={
              <svg fill="#ffffff" viewBox="0 -64 640 640" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M519.2 127.9l-47.6-47.6A56.252 56.252 0 0 0 432 64H205.2c-14.8 0-29.1 5.9-39.6 16.3L118 127.9H0v255.7h64c17.6 0 31.8-14.2 31.9-31.7h9.1l84.6 76.4c30.9 25.1 73.8 25.7 105.6 3.8 12.5 10.8 26 15.9 41.1 15.9 18.2 0 35.3-7.4 48.8-24 22.1 8.7 48.2 2.6 64-16.8l26.2-32.3c5.6-6.9 9.1-14.8 10.9-23h57.9c.1 17.5 14.4 31.7 31.9 31.7h64V127.9H519.2zM48 351.6c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16c0 8.9-7.2 16-16 16zm390-6.9l-26.1 32.2c-2.8 3.4-7.8 4-11.3 1.2l-23.9-19.4-30 36.5c-6 7.3-15 4.8-18 2.4l-36.8-31.5-15.6 19.2c-13.9 17.1-39.2 19.7-55.3 6.6l-97.3-88H96V175.8h41.9l61.7-61.6c2-.8 3.7-1.5 5.7-2.3H262l-38.7 35.5c-29.4 26.9-31.1 72.3-4.4 101.3 14.8 16.2 61.2 41.2 101.5 4.4l8.2-7.5 108.2 87.8c3.4 2.8 3.9 7.9 1.2 11.3zm106-40.8h-69.2c-2.3-2.8-4.9-5.4-7.7-7.7l-102.7-83.4 12.5-11.4c6.5-6 7-16.1 1-22.6L367 167.1c-6-6.5-16.1-6.9-22.6-1l-55.2 50.6c-9.5 8.7-25.7 9.4-34.6 0-9.3-9.9-8.5-25.1 1.2-33.9l65.6-60.1c7.4-6.8 17-10.5 27-10.5l83.7-.2c2.1 0 4.1.8 5.5 2.3l61.7 61.6H544v128zm48 47.7c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16c0 8.9-7.2 16-16 16z"></path>
                </g>
              </svg>
            }
            onClick={() => navigate("/donation-suggestions")}
            title="Smart Donation Assistant"
            subtitle="Match near-expiry products with local charities using AI to cut waste and support communities."
          />
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M16 7C16 6.07003 16 5.60504 15.8978 5.22354C15.6204 4.18827 14.8117 3.37962 13.7765 3.10222C13.395 3 12.93 3 12 3C11.07 3 10.605 3 10.2235 3.10222C9.18827 3.37962 8.37962 4.18827 8.10222 5.22354C8 5.60504 8 6.07003 8 7M14 11.5C13.5 11.376 12.6851 11.3714 12 11.376M12 11.376C11.7709 11.3775 11.9094 11.3678 11.6 11.376C10.7926 11.4012 10.0016 11.7368 10 12.6875C9.99825 13.7004 11 14 12 14C13 14 14 14.2312 14 15.3125C14 16.1251 13.1925 16.4812 12.1861 16.5991C11.3861 16.5991 11 16.625 10 16.5M12 11.376L12 10M12 16.5995V18M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V11.8C21 10.1198 21 9.27976 20.673 8.63803C20.3854 8.07354 19.9265 7.6146 19.362 7.32698C18.7202 7 17.8802 7 16.2 7H7.8C6.11984 7 5.27976 7 4.63803 7.32698C4.07354 7.6146 3.6146 8.07354 3.32698 8.63803C3 9.27976 3 10.1198 3 11.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/budgets")}
            title="Budget Manager"
            subtitle="Monitor supplier quotes, track approvals, and export budgets with ease."
          />
          <Tile
            badgeText="AI"
            overwriteIcon={
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000" stroke="#000000">
                <defs>
                  <style>
                    {`.cls-1 {
              fill: none;
              stroke: #ffffff;
              stroke-miterlimit: 10;
              stroke-width: 1.91px;
            }`}
                  </style>
                </defs>
                <path
                  className="cls-1"
                  d="M22.52,7.24V9.53a5.34,5.34,0,0,1-3,4.82,4.21,4.21,0,0,1,1.11,2.83v1.54H16.2A4.19,4.19,0,0,1,12,14.89H12A4.19,4.19,0,0,1,7.8,18.72H3.39V17.18A4.21,4.21,0,0,1,4.5,14.35a5.34,5.34,0,0,1-3-4.82V7.24H6.63a4.94,4.94,0,0,1,1,.09A9.81,9.81,0,0,1,12,1.5a9.81,9.81,0,0,1,4.42,5.83,4.94,4.94,0,0,1,.95-.09Z"
                />
                <line className="cls-1" x1="12" y1="7.24" x2="12" y2="23.5" />
                <line className="cls-1" x1="6.26" y1="11.07" x2="12" y2="14.89" />
                <line className="cls-1" x1="16.78" y1="11.07" x2="12" y2="13.93" />
              </svg>
            }
            onClick={() => navigate("/business-insights")}
            title="Seasonal Demand Predictor"
            subtitle="Forecast seasonal demand with AI to guide smarter stocking and sales decisions."
          />
          <Tile
            overwriteIcon={
              <svg fill="#ffffff" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M396.8 352h22.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-192 0h22.4c6.4 0 12.8-6.4 12.8-12.8V140.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h22.4c6.4 0 12.8-6.4 12.8-12.8V204.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zM496 400H48V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zm-387.2-48h22.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8z"></path>
                </g>
              </svg>
            }
            onClick={() => navigate("/analytics")}
            title="Analytics Hub"
            subtitle="Centralized analytics providing insights across smart factory features."
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          Inventory & Warehouse Management
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M21.9844 10C21.9473 8.68893 21.8226 7.85305 21.4026 7.13974C20.8052 6.12523 19.7294 5.56066 17.5777 4.43152L15.5777 3.38197C13.8221 2.46066 12.9443 2 12 2C11.0557 2 10.1779 2.46066 8.42229 3.38197L6.42229 4.43152C4.27063 5.56066 3.19479 6.12523 2.5974 7.13974C2 8.15425 2 9.41667 2 11.9415V12.0585C2 14.5833 2 15.8458 2.5974 16.8603C3.19479 17.8748 4.27063 18.4393 6.42229 19.5685L8.42229 20.618C10.1779 21.5393 11.0557 22 12 22C12.9443 22 13.8221 21.5393 15.5777 20.618L17.5777 19.5685C19.7294 18.4393 20.8052 17.8748 21.4026 16.8603C21.8226 16.1469 21.9473 15.3111 21.9844 14"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  ></path>{" "}
                  <path
                    d="M21 7.5L17 9.5M12 12L3 7.5M12 12V21.5M12 12C12 12 14.7426 10.6287 16.5 9.75C16.6953 9.65237 17 9.5 17 9.5M17 9.5V13M17 9.5L7.5 4.5"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/products")}
            title="Product Catalog"
            subtitle="View and manage of all products in the supply chain ecosystem."
          />
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M7 21V11.6C7 11.0399 7 10.7599 7.10899 10.546C7.20487 10.3578 7.35785 10.2048 7.54601 10.109C7.75992 9.99996 8.03995 9.99996 8.6 9.99996H15.4C15.9601 9.99996 16.2401 9.99996 16.454 10.109C16.6422 10.2048 16.7951 10.3578 16.891 10.546C17 10.7599 17 11.0399 17 11.6V21M10 14H14M10 18H14M3 10.4881V19.4C3 19.96 3 20.24 3.10899 20.454C3.20487 20.6421 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6421 20.891 20.454C21 20.24 21 19.96 21 19.4V10.4881C21 9.41436 21 8.87747 20.8368 8.40316C20.6925 7.98371 20.457 7.60148 20.1472 7.28399C19.797 6.92498 19.3174 6.68357 18.3583 6.20075L14.1583 4.08645C13.3671 3.68819 12.9716 3.48905 12.5564 3.41069C12.1887 3.34129 11.8113 3.34129 11.4436 3.41069C11.0284 3.48905 10.6329 3.68818 9.84171 4.08645L5.64171 6.20075C4.6826 6.68357 4.20304 6.92498 3.85275 7.28399C3.54298 7.60148 3.30746 7.98371 3.16317 8.40316C3 8.87747 3 9.41437 3 10.4881Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/warehouses")}
            title="Warehouse Manager"
            subtitle="Manage warehouse locations and capacity utilization."
          />
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M18 4L21 7M21 7L18 10M21 7H7C4.79086 7 3 8.79086 3 11M6 20L3 17M3 17L6 14M3 17H17C19.2091 17 21 15.2091 21 13"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/warehouse-transfers")}
            title="Warehouse Transfers"
            subtitle="Control and track inventory movements across warehouse facilities."
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          Operations & Logistics
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M7 13.0001H13M7 9.0001H9M7 17.0001H13M16 21.0001H18.5M17 21.0001H7.8C6.11984 21.0001 5.27976 21.0001 4.63803 20.6731C4.07354 20.3855 3.6146 19.9266 3.32698 19.3621C3 18.7203 3 17.8803 3 16.2001V5.75719C3 4.8518 3 4.3991 3.1902 4.13658C3.35611 3.90758 3.61123 3.75953 3.89237 3.72909C4.21467 3.6942 4.60772 3.9188 5.39382 4.368L5.70618 4.54649C5.99552 4.71183 6.14019 4.7945 6.29383 4.82687C6.42978 4.85551 6.57022 4.85551 6.70617 4.82687C6.85981 4.7945 7.00448 4.71183 7.29382 4.54649L9.20618 3.45372C9.49552 3.28838 9.64019 3.20571 9.79383 3.17334C9.92978 3.14469 10.0702 3.14469 10.2062 3.17334C10.3598 3.20571 10.5045 3.28838 10.7938 3.45372L12.7062 4.54649C12.9955 4.71183 13.1402 4.7945 13.2938 4.82687C13.4298 4.85551 13.5702 4.85551 13.7062 4.82687C13.8598 4.7945 14.0045 4.71183 14.2938 4.54649L14.6062 4.368C15.3923 3.9188 15.7853 3.6942 16.1076 3.72909C16.3888 3.75953 16.6439 3.90758 16.8098 4.13658C17 4.3991 17 4.8518 17 5.75719V14.0001M17 13.0001H21V19.0001C21 20.1047 20.1046 21.0001 19 21.0001C17.8954 21.0001 17 20.1047 17 19.0001V13.0001Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/orders")}
            title="Orders Overview"
            subtitle="Monitor client orders across the supply chain network."
          />
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M4 21C4 17.4735 6.60771 14.5561 10 14.0709M19.8726 15.2038C19.8044 15.2079 19.7357 15.21 19.6667 15.21C18.6422 15.21 17.7077 14.7524 17 14C16.2923 14.7524 15.3578 15.2099 14.3333 15.2099C14.2643 15.2099 14.1956 15.2078 14.1274 15.2037C14.0442 15.5853 14 15.9855 14 16.3979C14 18.6121 15.2748 20.4725 17 21C18.7252 20.4725 20 18.6121 20 16.3979C20 15.9855 19.9558 15.5853 19.8726 15.2038ZM15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/users")}
            title="User Management"
            subtitle="Manage users across the system."
          />
          <Tile
            overwriteIcon={
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M9.09557 20.7929L11.9274 14.6574C11.9505 14.6073 11.962 14.5822 11.978 14.5744C11.9919 14.5676 12.0081 14.5676 12.022 14.5744C12.038 14.5822 12.0495 14.6073 12.0726 14.6574L14.9044 20.7929C14.9337 20.8564 14.9484 20.8882 14.9425 20.9067C14.9374 20.9227 14.9247 20.9351 14.9085 20.9396C14.8899 20.9449 14.8586 20.9293 14.796 20.898L12.0358 19.5179L12.0358 19.5179C12.0227 19.5113 12.0161 19.508 12.0092 19.5068C12.0031 19.5056 11.9969 19.5056 11.9908 19.5068C11.9839 19.508 11.9773 19.5113 11.9642 19.5179L11.9642 19.5179L9.20399 20.898C9.14142 20.9293 9.11014 20.9449 9.09149 20.9396C9.07533 20.9351 9.06256 20.9227 9.05748 20.9067C9.0516 20.8882 9.06626 20.8564 9.09557 20.7929Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                  ></path>{" "}
                  <path d="M4 18L7 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                  <path d="M20 18L17 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                  <path d="M12 11L12 9" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                  <path d="M12 6L12 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                </g>
              </svg>
            }
            onClick={() => navigate("/trips")}
            title="Logistics & Deliveries"
            subtitle="Manage and track deliveries across the supply chain."
          />
        </div>
      </div>
    </>
  );
}
