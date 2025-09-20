import { useNavigate } from "react-router";
import Tile from "~/components/Tile";

export function SupplierSection() {
  const navigate = useNavigate();

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        Supplier Management Center
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/supplier-products")}
          title="Product Registration"
          subtitle="Review and manage product approvals for your supply catalog submissions"
        />
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/supplier-product-records")}
          title="My Product Records"
          subtitle="View comprehensive history of all your submitted inventory records"
        />
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/register-product-record")}
          title="Register New Products"
          subtitle="Submit new product batches and inventory additions to the system"
        />
      </div>
    </div>
  );
}

