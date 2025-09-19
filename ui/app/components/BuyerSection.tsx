import { useNavigate } from "react-router";
import Tile from "~/components/Tile";

export function BuyerSection() {
  const navigate = useNavigate();

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        Your Shopping Hub
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/available-items")}
          title="Place New Order"
          subtitle="Browse available products and create orders from current inventory stock"
        />
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/my-orders")}
          title="My Orders"
          subtitle="Track your order history, delivery status, and manage existing purchases"
        />
      </div>
    </div>
  );
}

