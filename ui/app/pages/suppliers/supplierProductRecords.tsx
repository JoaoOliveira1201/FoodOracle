import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import Button from "~/components/Button";

interface ProductRecord {
  record_id: number;
  product_id: number;
  supplier_id: number;
  supplier_name: string;
  warehouse_id: number | null;
  warehouse_name: string | null;
  quantity_kg: number;
  quality_classification: "Good" | "Sub-optimal" | "Bad";
  status: "InStock" | "Sold" | "Discarded" | "Donated";
  image_path: string | null;
  registration_date: string;
  sale_date: string | null;
}

interface Product {
  product_id: number;
  name: string;
}

interface ProductRecordWithProductName extends ProductRecord {
  product_name: string;
}

export function SupplierProductRecords() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSupplier } = useAuth();
  const [productRecords, setProductRecords] = useState<ProductRecordWithProductName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isSupplier() || !user) {
      setError("Access denied. Only suppliers can view this page.");
      setLoading(false);
      return;
    }

    fetchProductRecords();
  }, [user, isSupplier]);

  useEffect(() => {
    // Check for success message from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchProductRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch product records for this supplier
      const recordsResponse = await fetch(`http://localhost:8000/product-records/supplier/${user?.user_id}`);
      if (!recordsResponse.ok) {
        throw new Error(`Failed to fetch product records: ${recordsResponse.status}`);
      }
      const recordsData: ProductRecord[] = await recordsResponse.json();

      // Fetch all products to get product names
      const productsResponse = await fetch("http://localhost:8000/products/");
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
      }
      const productsData: Product[] = await productsResponse.json();

      // Combine records with product names
      const recordsWithProductNames: ProductRecordWithProductName[] = recordsData.map(record => {
        const product = productsData.find(p => p.product_id === record.product_id);
        return {
          ...record,
          product_name: product?.name || "Unknown Product"
        };
      });

      setProductRecords(recordsWithProductNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "InStock":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            📦 In Stock
          </span>
        );
      case "Sold":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            💰 Sold
          </span>
        );
      case "Discarded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            🗑️ Discarded
          </span>
        );
      case "Donated":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            💝 Donated
          </span>
        );
      default:
        return null;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "Good":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            ✅ Good
          </span>
        );
      case "Sub-optimal":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            ⚠️ Sub-optimal
          </span>
        );
      case "Bad":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            ❌ Bad
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            — Not Classified
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading product records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
        <div className="mt-4">
          <Button
            color="secondary"
            label="Back to Home"
            onClick={() => navigate('/home')}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">My Product Records</h1>
        <Button 
          color="primary" 
          label="Register New Product" 
          onClick={() => navigate("/register-product-record")} 
        />
      </div>
      <div className="px-28 pt-2">
        {successMessage && (
          <div className="mb-4 p-4 text-sm text-green-300 bg-green-900/20 border border-green-800 rounded-md">
            {successMessage}
          </div>
        )}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Your Product Inventory:</strong> These are the product records you've submitted to the system. 
            Each record represents a specific batch of products with quantity, quality classification, and current status.
          </p>
        </div>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Record ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Quantity (kg)
                </th>
                <th scope="col" className="px-6 py-3">
                  Quality
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Warehouse
                </th>
                <th scope="col" className="px-6 py-3">
                  Registration Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Sale Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Image
                </th>
              </tr>
            </thead>
            <tbody>
              {productRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📦</div>
                      <div className="text-lg font-medium mb-1">No Product Records Found</div>
                      <div className="text-sm">You haven't submitted any product records yet.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                productRecords.map((record, idx) => (
                  <tr
                    key={record.record_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      #{record.record_id}
                    </th>
                    <td className="px-6 py-4 font-medium">{record.product_name}</td>
                    <td className="px-6 py-4">{record.quantity_kg || "—"} kg</td>
                    <td className="px-6 py-4">
                      {getQualityBadge(record.quality_classification)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4">
                      {record.warehouse_name ? (
                        record.warehouse_name
                      ) : (
                        <span className="text-gray-400 italic">
                          {record.status === "Discarded" ? "No warehouse (discarded)" :
                           record.status === "Sold" ? "No warehouse (sold)" :
                           record.status === "Donated" ? "No warehouse (donated)" : "No warehouse assigned"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{formatDate(record.registration_date)}</td>
                    <td className="px-6 py-4">{formatDate(record.sale_date)}</td>
                    <td className="px-6 py-4">
                      {record.image_path ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          📸 Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          — No Image
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {productRecords.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {productRecords.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {productRecords.filter(r => r.status === "InStock").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">In Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {productRecords.filter(r => r.status === "Sold").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {productRecords.filter(r => r.status === "Discarded").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Discarded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {productRecords.filter(r => r.status === "Donated").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Donated</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
