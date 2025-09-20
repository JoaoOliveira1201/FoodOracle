import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface Product {
  product_id: number;
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

export function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:8000/products/");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleDelete = async (productId: number) => {
    setDeletingId(productId);
    try {
      const response = await fetch(`http://localhost:8000/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete product");
      }

      // Remove the product from the list
      setProducts(products.filter(product => product.product_id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
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
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Products:</h1>
        <Button color="primary" label="Create" onClick={() => navigate("create")} />
      </div>
      <div className="px-28 pt-2">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Name
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
                  Discount Deadline
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr
                    key={product.product_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {product.product_id}
                    </th>
                    <td className="px-6 py-4">{product.name}</td>
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
                    <td className="px-6 py-4">{product.deadline_to_discount}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${product.product_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => navigate(`edit/${product.product_id}`)}
                          className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.product_id)}
                          disabled={deletingId === product.product_id}
                          className="cursor-pointer font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === product.product_id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
