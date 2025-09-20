import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import Button from "~/components/Button";
import { QuoteSubmissionModal } from "~/components/QuoteSubmissionModal";

interface Product {
  product_id: number;
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

interface Quote {
  quote_id: number;
  supplier_id: number;
  product_id: number;
  pdf_document_path: string | null;
  status: "Pending" | "Approved" | "Rejected";
  submission_date: string;
}

interface ProductWithQuoteStatus extends Product {
  quoteStatus: "Pending" | "Approved" | "Rejected" | "Not Submitted";
  quoteId?: number;
}

export function SupplierProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSupplier } = useAuth();
  const [products, setProducts] = useState<ProductWithQuoteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithQuoteStatus | null>(null);

  useEffect(() => {
    if (!isSupplier() || !user) {
      setError("Access denied. Only suppliers can view this page.");
      setLoading(false);
      return;
    }

    fetchProductsWithQuoteStatus();
  }, [user, isSupplier]);

  useEffect(() => {
    // Check for success message from quote submission
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from history state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchProductsWithQuoteStatus = async () => {
    try {
      // Fetch all products
      const productsResponse = await fetch("http://34.235.125.104:8000/products/");
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
      }
      const productsData = await productsResponse.json();

      // Fetch quotes for this supplier
      const quotesResponse = await fetch(`http://34.235.125.104:8000/quotes/?supplier_id=${user?.user_id}`);
      if (!quotesResponse.ok) {
        throw new Error(`Failed to fetch quotes: ${quotesResponse.status}`);
      }
      const quotesData: Quote[] = await quotesResponse.json();

      // Combine products with their quote status
      const productsWithStatus: ProductWithQuoteStatus[] = productsData.map((product: Product) => {
        const quote = quotesData.find((q) => q.product_id === product.product_id);
        return {
          ...product,
          quoteStatus: quote ? quote.status : "Not Submitted",
          quoteId: quote?.quote_id,
        };
      });

      setProducts(productsWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (product: ProductWithQuoteStatus) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleQuoteSuccess = async (message: string) => {
    setSuccessMessage(message);
    // Refresh the data to show updated status
    await fetchProductsWithQuoteStatus();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            ✓ Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            ✗ Rejected
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            ⏳ Pending
          </span>
        );
      case "Not Submitted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            — Not Submitted
          </span>
        );
      default:
        return null;
    }
  };

  const getActionButton = (product: ProductWithQuoteStatus) => {
    if (product.quoteStatus === "Rejected") {
      return <Button color="primary" size="small" label="Submit New" onClick={() => handleOpenQuoteModal(product)} />;
    }
    if (product.quoteStatus === "Not Submitted") {
      return <Button color="success" size="small" label="Submit Quote" onClick={() => handleOpenQuoteModal(product)} />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Product Quotations</h1>
      </div>
      <div className="px-28 pt-2">
        {successMessage && (
          <div className="mb-4 p-4 text-sm text-green-300 bg-green-900/20 border border-green-800 rounded-md">
            {successMessage}
          </div>
        )}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>How it works:</strong> To register products for sale, you need approval from administrators. Submit
            quotes for products you want to sell. Once approved, you can create product records.
          </p>
        </div>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Base Price
                </th>
                <th scope="col" className="px-6 py-3">
                  Discount %
                </th>
                <th scope="col" className="px-6 py-3">
                  Refrigeration
                </th>
                <th scope="col" className="px-6 py-3">
                  Shelf Life (Days)
                </th>
                <th scope="col" className="px-6 py-3">
                  Registration Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr
                    key={product.product_id}
                    className={`${
                      idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {product.name}
                    </th>
                    <td className="px-6 py-4">${product.base_price}</td>
                    <td className="px-6 py-4">{product.discount_percentage}%</td>
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
                    <td className="px-6 py-4">{product.shelf_life_days}</td>
                    <td className="px-6 py-4">{getStatusBadge(product.quoteStatus)}</td>
                    <td className="px-6 py-4">{getActionButton(product)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Submission Modal */}
      {selectedProduct && user && (
        <QuoteSubmissionModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
          supplierId={user.user_id}
          onSuccess={handleQuoteSuccess}
        />
      )}
    </>
  );
}
