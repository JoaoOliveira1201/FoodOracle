import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface ProductRecord {
  record_id: number;
  product_id: number;
  supplier_id: number;
  supplier_name: string;
  warehouse_id: number | null;
  warehouse_name: string | null;
  quantity_kg: number;
  quality_classification: string;
  status: string;
  image_path: string;
  registration_date: string;
  sale_date: string;
}

interface ProductMetrics {
  total_in_stock_kg: number;
  total_sold_kg: number;
  total_discarded_kg: number;
  total_donated_kg: number;
  total_records: number;
  total_profit: number;
  average_days_to_sell: number;
  quality_distribution: {
    Good: number;
    "Sub-optimal": number;
    Bad: number;
  };
  revenue_by_status: {
    InStock: number;
    Sold: number;
    Discarded: number;
    Donated: number;
  };
  inventory_turnover_rate: number;
  loss_percentage: number;
  base_price: number;
  discount_percentage: number;
}

interface Product {
  product_id: number;
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

interface ApprovedSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_contact: string;
  approval_date: string;
}

interface ApprovedSuppliersResponse {
  product_id: number;
  approved_suppliers: ApprovedSupplier[];
  total_approved: number;
}

export function ProductInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [approvedSuppliers, setApprovedSuppliers] = useState<ApprovedSuppliersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedImages, setExpandedImages] = useState<Set<number>>(new Set());
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchProductRecords() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/product-records/product/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProductRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch product records");
      } finally {
        setLoading(false);
      }
    }

    async function fetchProduct() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/products/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.warn("Failed to fetch product details:", err);
        // Don't set error state for product, just log it
      }
    }

    async function fetchMetrics() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/product-records/product/${id}/metrics`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.warn("Failed to fetch metrics:", err);
        // Don't set error state for metrics, just log it
      } finally {
        setMetricsLoading(false);
      }
    }

    async function fetchApprovedSuppliers() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/quotes/product/${id}/approved-suppliers`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setApprovedSuppliers(data);
      } catch (err) {
        console.warn("Failed to fetch approved suppliers:", err);
        // Don't set error state for suppliers, just log it
      } finally {
        setSuppliersLoading(false);
      }
    }

    if (id) {
      fetchProductRecords();
      fetchProduct();
      fetchMetrics();
      fetchApprovedSuppliers();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
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

  const getQualityBadgeColor = (quality: string) => {
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
          <Button color="secondary" label="Back to Products" onClick={() => navigate("/products")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">
          {product ? `Product Records - ${product.name}` : `Product Records - ID: ${id}`}
        </h1>
        <Button color="secondary" label="Back to Products" onClick={() => navigate("/products")} />
      </div>
      
      {/* Metrics Dashboard */}
      {!metricsLoading && metrics && (
        <div className="px-28 pt-4 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Product Metrics Overview</h2>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {/* Total In Stock */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">Total In Stock</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{metrics.total_in_stock_kg} kg</div>
              </div>
              
              {/* Total Sold */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sold</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.total_sold_kg} kg</div>
              </div>
              
              {/* Total Discarded */}
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Discarded</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{metrics.total_discarded_kg} kg</div>
              </div>
              
              {/* Total Donated */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Donated</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{metrics.total_donated_kg} kg</div>
              </div>
              
              {/* Total Profit */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Profit</div>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">${metrics.total_profit}</div>
              </div>
            </div>
            
            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Average Days to Sell */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avg Days to Sell</div>
                <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{metrics.average_days_to_sell}</div>
              </div>
              
              {/* Inventory Turnover */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Turnover Rate</div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{metrics.inventory_turnover_rate}%</div>
              </div>
              
              {/* Loss Percentage */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Loss Rate</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{metrics.loss_percentage}%</div>
              </div>
              
              {/* Total Records */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{metrics.total_records}</div>
              </div>
            </div>
            
            {/* Quality Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quality Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">Good Quality</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">{metrics.quality_distribution.Good} kg</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Sub-optimal</div>
                  <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{metrics.quality_distribution["Sub-optimal"]} kg</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Bad Quality</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">{metrics.quality_distribution.Bad} kg</div>
                </div>
              </div>
            </div>
            
            {/* Revenue by Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Revenue by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">In Stock Value</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">${metrics.revenue_by_status.InStock}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">Sold Revenue</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">${metrics.revenue_by_status.Sold}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Discarded Loss</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">${metrics.revenue_by_status.Discarded}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Donated Value</div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100">${metrics.revenue_by_status.Donated}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Approved Suppliers Section */}
      {!suppliersLoading && approvedSuppliers && (
        <div className="px-28 pt-4 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Approved Suppliers</h2>
              <div className="bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {approvedSuppliers.total_approved} Approved
                </span>
              </div>
            </div>
            
            {approvedSuppliers.approved_suppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">No Approved Suppliers</p>
                <p>No suppliers have been approved to register this product yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {approvedSuppliers.approved_suppliers.map((supplier) => (
                  <div
                    key={supplier.supplier_id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {supplier.supplier_name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {supplier.supplier_id}
                            </p>
                          </div>
                        </div>
                        <div className="ml-11 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {supplier.supplier_contact || 'No contact info'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approved on {formatDate(supplier.approval_date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/users/info/${supplier.supplier_id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Supplier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="px-28 pt-2 pb-8">
        {productRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No records found for this product.
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
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Warehouse
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
                    Sale Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Image
                  </th>
                </tr>
              </thead>
              <tbody>
                {productRecords.map((record, idx) => (
                  <>
                    <tr
                      key={record.record_id}
                      className={`${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      } border-b border-gray-200 dark:border-gray-700`}
                    >
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {record.record_id}
                      </th>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{record.supplier_name}</div>
                          <div className="text-xs text-gray-500">ID: {record.supplier_id}</div>
                        </div>
                        <button
                          onClick={() => navigate(`/users/info/${record.supplier_id}`)}
                          className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          title="View supplier details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.warehouse_id && record.warehouse_name ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{record.warehouse_name}</div>
                            <div className="text-xs text-gray-500">ID: {record.warehouse_id}</div>
                          </div>
                          <button
                            onClick={() => navigate(`/warehouses/info/${record.warehouse_id}`)}
                            className="cursor-pointer text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                            title="View warehouse details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-gray-400 italic">
                            {record.status === "Discarded" ? "No warehouse (discarded)" :
                             record.status === "Sold" ? "No warehouse (sold)" :
                             record.status === "Donated" ? "No warehouse (donated)" : "No warehouse assigned"}
                          </div>
                        </div>
                      )}
                    </td>
                      <td className="px-6 py-4">{record.quantity_kg}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityBadgeColor(record.quality_classification)}`}
                        >
                          {record.quality_classification}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(record.registration_date)}</td>
                      <td className="px-6 py-4">
                        {record.sale_date ? formatDate(record.sale_date) : "Not sold"}
                      </td>
                      <td className="px-6 py-4">
                        {record.image_path ? (
                          <button
                            onClick={() => toggleImage(record.record_id)}
                            className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                          >
                            {expandedImages.has(record.record_id) ? "Hide Image" : "Show Image"}
                          </button>
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </td>
                    </tr>
                    {expandedImages.has(record.record_id) && record.image_path && (
                      <tr className={`${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}>
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex justify-center">
                            {imageUrls[record.record_id] ? (
                              <img
                                src={imageUrls[record.record_id]}
                                alt={`Product record ${record.record_id}`}
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
