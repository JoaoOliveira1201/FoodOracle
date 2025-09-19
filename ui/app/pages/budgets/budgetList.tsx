import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

// TypeScript interfaces for budget data from the API
interface Budget {
  quote_id: number;
  supplier_id: number | null;
  product_id: number | null;
  pdf_document_path: string | null;
  status: string;
  submission_date: string;
  supplier_name?: string;
  product_name?: string;
}

interface User {
  user_id: number;
  name: string;
  contact_info: string;
  role: string;
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

export function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBudgets() {
      try {
        setLoading(true);
        setError("");

        // Fetch quotes (which serve as budget requests)
        const quotesResponse = await fetch("http://localhost:8000/quotes/");
        if (!quotesResponse.ok) {
          throw new Error(`Failed to fetch quotes: ${quotesResponse.status}`);
        }
        const quotes = await quotesResponse.json();

        // Fetch users and products to enrich the data
        const [usersResponse, productsResponse] = await Promise.all([
          fetch("http://localhost:8000/users/"),
          fetch("http://localhost:8000/products/")
        ]);

        let users: User[] = [];
        let products: Product[] = [];

        if (usersResponse.ok) {
          users = await usersResponse.json();
        }

        if (productsResponse.ok) {
          products = await productsResponse.json();
        }

        // Create lookup maps for performance
        const userMap = new Map(users.map(user => [user.user_id, user]));
        const productMap = new Map(products.map(product => [product.product_id, product]));

        // Enrich quotes with supplier and product names
        const enrichedBudgets: Budget[] = quotes.map((quote: any) => ({
          ...quote,
          supplier_name: quote.supplier_id ? userMap.get(quote.supplier_id)?.name || `User ${quote.supplier_id}` : "Unknown Supplier",
          product_name: quote.product_id ? productMap.get(quote.product_id)?.name || `Product ${quote.product_id}` : "Unknown Product"
        }));

        setBudgets(enrichedBudgets);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch budget data";
        setError(errorMessage);
        console.error("Error fetching budgets:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading budget data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error loading budgets</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Budgets:</h1>
      </div>
      <div className="px-28 pt-2">
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-600">
            <div className="text-gray-500 dark:text-gray-400 text-center">
              <p className="text-lg font-semibold">No budgets found</p>
              <p className="text-sm mt-2">No budget requests are currently available</p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Budget ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Supplier
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Submission Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Document
                </th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget: Budget, idx: number) => (
                <tr
                  key={budget.quote_id}
                  className={`${
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  } border-b border-gray-200 dark:border-gray-700`}
                >
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    #{budget.quote_id}
                  </th>
                  <td className="px-6 py-4">{budget.product_name || "Unknown Product"}</td>
                  <td className="px-6 py-4">{budget.supplier_name || "Unknown Supplier"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      budget.status === 'Approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : budget.status === 'Rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {budget.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(budget.submission_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {budget.pdf_document_path ? (
                      <a
                        href={`http://localhost:8000/quotes/${budget.quote_id}/document`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer font-medium text-green-600 dark:text-green-500 hover:underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-gray-400">No document</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
