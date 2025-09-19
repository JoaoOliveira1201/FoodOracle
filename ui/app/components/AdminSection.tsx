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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Analytics & Intelligence
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/budgetAdvisorChatbot")}
            title="Budget Advisor"
            subtitle="AI-powered budget analysis and recommendations for optimal spending decisions"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/transfer-suggestions")}
            title="Transfer Suggestions"
            subtitle="AI-driven redistribution plans and truck route optimization"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/donation-suggestions")}
            title="Donation Suggestions"
            subtitle="AI-powered recommendations for donating expiring products to local charities"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/budgets")}
            title="Budget Management"
            subtitle="Monitor and control your approved quotes"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/business-insights")}
            title="Business Insights"
            subtitle="AI-powered recommendations, seasonal analysis, and strategic business intelligence"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/analytics")}
            title="Analytics Dashboard"
            subtitle="Comprehensive platform metrics: revenue, inventory, operations, and performance analytics"
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          Inventory & Warehouse Management
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/products")}
            title="Product Catalog"
            subtitle="Comprehensive view of all products in your supply chain ecosystem"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/warehouses")}
            title="Warehouse Network"
            subtitle="Manage multiple warehouse locations and their capacity utilization"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/warehouse-transfers")}
            title="Warehouse Transfers"
            subtitle="Orchestrate seamless inventory movements between warehouse facilities"
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          Operations & Logistics
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/orders")}
            title="Order Management"
            subtitle="Complete oversight of all orders across your entire supply chain network"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/users")}
            title="User Administration"
            subtitle="Manage user accounts, roles, and permissions across all system modules"
          />
          <Tile
            iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
            onClick={() => navigate("/trips")}
            title="Logistics & Delivery"
            subtitle="Track delivery routes, shipping schedules, and transportation coordination"
          />
        </div>
      </div>

    </>
  );
}