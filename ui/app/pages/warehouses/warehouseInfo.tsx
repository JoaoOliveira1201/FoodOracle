import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface ProductInStorage {
  record_id: number;
  product_id: number;
  product_name: string;
  quantity_kg: number | null;
  quality_classification: string | null;
  status: string;
  registration_date: string | null;
  requires_refrigeration: boolean;
  base_price: number | null;
  shelf_life_days: number | null;
  deadline_to_discount: number | null;
}

interface WarehouseDetail {
  warehouse_id: number;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
  products_in_storage: ProductInStorage[];
}

export function WarehouseInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [warehouseDetail, setWarehouseDetail] = useState<WarehouseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedImages, setExpandedImages] = useState<Set<number>>(new Set());
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchWarehouseDetail() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/warehouses/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setWarehouseDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch warehouse details");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchWarehouseDetail();
    }
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "InStock":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Sold":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Discarded":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Donated":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getQualityBadgeColor = (quality: string | null) => {
    if (!quality) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    switch (quality) {
      case "Good":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Fair":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Poor":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const toggleImage = (recordId: number) => {
    const newExpanded = new Set(expandedImages);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
      // Set the direct image URL (backend will serve the image directly)
      if (!imageUrls[recordId]) {
        setImageUrls(prev => ({ 
          ...prev, 
          [recordId]: `http://34.235.125.104:8000/product-records/${recordId}/image` 
        }));
      }
    }
    setExpandedImages(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading warehouse details...</span>
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
          <Button color="secondary" label="Back to Warehouses" onClick={() => navigate("/warehouses")} />
        </div>
      </div>
    );
  }

  if (!warehouseDetail) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-gray-300">
          Warehouse not found.
        </div>
        <div className="mt-4">
          <Button color="secondary" label="Back to Warehouses" onClick={() => navigate("/warehouses")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Warehouse: {warehouseDetail.name}</h1>
        <Button color="secondary" label="Back to Warehouses" onClick={() => navigate("/warehouses")} />
      </div>

      {/* Warehouse Details */}
      <div className="px-28 pt-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Warehouse Details</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="font-medium">ID:</span> {warehouseDetail.warehouse_id}
            </div>
            <div>
              <span className="font-medium">Name:</span> {warehouseDetail.name}
            </div>
            <div>
              <span className="font-medium">Location:</span> {warehouseDetail.location.latitude.toFixed(6)}, {warehouseDetail.location.longitude.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Normal Capacity:</span> {warehouseDetail.normal_capacity_kg !== null ? `${warehouseDetail.normal_capacity_kg} kg` : "N/A"}
            </div>
            <div className="col-span-1">
              <span className="font-medium">Refrigerated Capacity:</span> {warehouseDetail.refrigerated_capacity_kg !== null ? `${warehouseDetail.refrigerated_capacity_kg} kg` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Products in Storage */}
      <div className="px-28 pb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Products in Storage</h2>
        {warehouseDetail.products_in_storage.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-800 rounded-lg">
            No products currently stored in this warehouse.
          </div>
        ) : (
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
                    Registration Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Refrigeration
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Base Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Image
                  </th>
                </tr>
              </thead>
              <tbody>
                {warehouseDetail.products_in_storage.map((product, idx) => (
                  <>
                    <tr
                      key={product.record_id}
                      className={`${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      } border-b border-gray-200 dark:border-gray-700`}
                    >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {product.record_id}
                    </th>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{product.product_name}</div>
                        <div className="text-xs text-gray-500">ID: {product.product_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{product.quantity_kg !== null ? product.quantity_kg : "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityBadgeColor(product.quality_classification)}`}
                      >
                        {product.quality_classification || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDate(product.registration_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.requires_refrigeration
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {product.requires_refrigeration ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">${product.base_price !== null ? product.base_price : "N/A"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleImage(product.record_id)}
                        className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                      >
                        {expandedImages.has(product.record_id) ? "Hide Image" : "Show Image"}
                      </button>
                    </td>
                    </tr>
                    {expandedImages.has(product.record_id) && (
                      <tr className={`${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}>
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex justify-center">
                            {imageUrls[product.record_id] ? (
                              <img
                                src={imageUrls[product.record_id]}
                                alt={`Product record ${product.record_id}`}
                                className="max-w-md max-h-96 object-contain rounded-lg shadow-lg"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+";
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-64 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                                <span className="ml-2 text-gray-600">Loading image...</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}