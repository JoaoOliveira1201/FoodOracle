import { useEffect, useState } from "react";
import { ChatWindow } from "~/components/ChatWindow";
import { classNames } from "~/helpers/generic";

export function BudgetAdvisorChatbot() {
  async function handleSend(userMessage: string, productId: string): Promise<string> {
    console.log("User asked:", userMessage, "for product:", productId);

    if (productId === "default") {
      return "Please select a product first to get personalized budget advice.";
    }

    try {
      const response = await fetch("http://34.235.125.104:8000/budget-advisor/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: parseInt(productId),
          query: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.answer || "I'm sorry, I couldn't process your question right now.";
    } catch (error) {
      console.error("Error calling budget advisor:", error);
      return "I'm sorry, I'm having trouble connecting to my services right now. Please try again later.";
    }
  }

  async function handleCardAction(action: "accept" | "reject", cardId: number) {
    console.log(`${action} clicked for card ${cardId}`);

    try {
      const status = action === "accept" ? "Approved" : "Rejected";
      const response = await fetch(`http://34.235.125.104:8000/quotes/${cardId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh the quotes after updating status (only pending quotes)
      if (selectedOption !== "default") {
        const quotesResponse = await fetch(`http://34.235.125.104:8000/quotes/?product_id=${selectedOption}&status=Pending`);
        if (quotesResponse.ok) {
          const quotes = await quotesResponse.json();

          // Fetch supplier tiers for all quotes
          const uniqueSupplierIds = [...new Set(quotes.map((quote: any) => quote.supplier_id).filter(Boolean))];
          const tierPromises = uniqueSupplierIds.map(async (supplierId: number) => {
            const tier = await fetchSupplierTier(supplierId);
            return [supplierId, tier];
          });

          const tierResults = await Promise.all(tierPromises);
          const newSupplierTiers = new Map(tierResults);
          setSupplierTiers(newSupplierTiers);

          const quoteCards: Card[] = quotes.map((quote: any) => {
            const supplierName = quote.supplier_id
              ? suppliers.get(quote.supplier_id) || `Unknown Supplier (ID: ${quote.supplier_id})`
              : "N/A";
            const supplierTier = quote.supplier_id ? newSupplierTiers.get(quote.supplier_id) || "basic" : "basic";

            return {
              id: quote.quote_id,
              title: `Quote #${quote.quote_id}`,
              description: `Supplier: ${supplierName} | Status: ${quote.status} | Submitted: ${new Date(quote.submission_date).toLocaleDateString()}`,
              pdf_document_path: quote.pdf_document_path,
              supplier_tier: supplierTier,
            };
          });
          setCards(quoteCards);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing quote:`, error);
      // You could show a toast notification here
    }
  }

  const [selectedOption, setSelectedOption] = useState("default");

  type Option = { value: string; label: string };
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  type Card = { id: number; title: string; description: string; pdf_document_path?: string; supplier_tier?: string };
  const [cards, setCards] = useState<Card[]>([]);

  // State to store supplier lookup
  const [suppliers, setSuppliers] = useState<Map<number, string>>(new Map());
  // State to store supplier tiers
  const [supplierTiers, setSupplierTiers] = useState<Map<number, string>>(new Map());

  // Function to get tier styling (similar to userInfo.tsx)
  const getTierInfo = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return {
          bgColor: "bg-purple-100 dark:bg-purple-900/20",
          textColor: "text-purple-800 dark:text-purple-200",
          borderColor: "border-purple-300 dark:border-purple-700",
        };
      case "gold":
        return {
          bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
          textColor: "text-yellow-800 dark:text-yellow-200",
          borderColor: "border-yellow-300 dark:border-yellow-700",
        };
      case "silver":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-700/20",
          textColor: "text-gray-800 dark:text-gray-200",
          borderColor: "border-gray-300 dark:border-gray-600",
        };
      case "bronze":
        return {
          bgColor: "bg-orange-100 dark:bg-orange-900/20",
          textColor: "text-orange-800 dark:text-orange-200",
          borderColor: "border-orange-300 dark:border-orange-700",
        };
      case "basic":
      default:
        return {
          bgColor: "bg-gray-50 dark:bg-gray-800/20",
          textColor: "text-gray-700 dark:text-gray-300",
          borderColor: "border-gray-200 dark:border-gray-600",
        };
    }
  };

  // Function to fetch supplier tier
  async function fetchSupplierTier(supplierId: number): Promise<string> {
    try {
      const response = await fetch(`http://34.235.125.104:8000/product-records/supplier/${supplierId}/statistics`);
      if (response.ok) {
        const stats = await response.json();
        return stats.supplier_tier || "basic";
      }
    } catch (error) {
      console.warn(`Failed to fetch tier for supplier ${supplierId}:`, error);
    }
    return "basic";
  }

  // Fetch dropdown options from products API and suppliers
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        // Fetch products
        const productsResponse = await fetch("http://34.235.125.104:8000/products/");
        if (!productsResponse.ok) {
          throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        const productOptions: Option[] = products.map((product: any) => ({
          value: product.product_id.toString(),
          label: product.name,
        }));

        // Fetch suppliers (users)
        const usersResponse = await fetch("http://34.235.125.104:8000/users/");
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const supplierMap = new Map(users.map((user: any) => [user.user_id, user.name]));
          setSuppliers(supplierMap);
        }

        setOptions(productOptions);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch initial data");
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Fetch quotes whenever selectedOption changes
  useEffect(() => {
    if (selectedOption === "default") {
      setCards([]);
      return;
    }

    async function fetchQuotes() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/quotes/?product_id=${selectedOption}&status=Pending`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const quotes = await response.json();

        // Fetch supplier tiers for all quotes
        const uniqueSupplierIds = [...new Set(quotes.map((quote: any) => quote.supplier_id).filter(Boolean))];
        const tierPromises = uniqueSupplierIds.map(async (supplierId: number) => {
          const tier = await fetchSupplierTier(supplierId);
          return [supplierId, tier];
        });

        const tierResults = await Promise.all(tierPromises);
        const newSupplierTiers = new Map(tierResults);
        setSupplierTiers(newSupplierTiers);

        const quoteCards: Card[] = quotes.map((quote: any) => {
          const supplierName = quote.supplier_id
            ? suppliers.get(quote.supplier_id) || `Unknown Supplier (ID: ${quote.supplier_id})`
            : "N/A";
          const supplierTier = quote.supplier_id ? newSupplierTiers.get(quote.supplier_id) || "basic" : "basic";

          return {
            id: quote.quote_id,
            title: `Quote #${quote.quote_id}`,
            description: `Supplier: ${supplierName} | Status: ${quote.status} | Submitted: ${new Date(quote.submission_date).toLocaleDateString()}`,
            pdf_document_path: quote.pdf_document_path,
            supplier_tier: supplierTier,
          };
        });

        setCards(quoteCards);
      } catch (err) {
        console.error("Error fetching quotes:", err);
        setCards([]);
      }
    }

    fetchQuotes();
  }, [selectedOption]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER WITH DROPDOWN */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
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
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Budget Advisor</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Optimize spending with AI-powered supplier comparisons and budget recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-center">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
                  <span className="text-gray-500 dark:text-gray-400">Loading products...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  Error loading products: {error}
                </div>
              ) : (
                <div className="relative">
                  <label htmlFor="product-select" className="sr-only">
                    Select a product
                  </label>
                  <select
                    id="product-select"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px]"
                  >
                    <option value="default">Select a product</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {selectedOption === "default" ? (
        /* DEFAULT STATE - No Product Selected */
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <svg className="scale-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Budget Advisor Assistant</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get personalized budget advice and manage quotes for your products. Select a product from the dropdown
                above to get started.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Budget Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get intelligent budget recommendations based on product data and market trends.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Quote Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review, approve, or reject supplier quotes with integrated document viewing.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  AI Chat Support
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions and get instant answers about budgeting strategies and costs.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Select a product above to begin
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PRODUCT SELECTED STATE */
        <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* LEFT COLUMN */}
          <div className="w-1/3 p-6 space-y-4 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {cards.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-600">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Pending Quotes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  There are currently no pending quotes for this product. Pending quotes will appear here when submitted
                  by suppliers.
                </p>
              </div>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white dark:bg-gray-700 shadow-sm hover:shadow-md rounded-2xl p-4 transition border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h3>
                    {card.supplier_tier && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          getTierInfo(card.supplier_tier).bgColor
                        } ${getTierInfo(card.supplier_tier).textColor} ${getTierInfo(card.supplier_tier).borderColor}`}
                      >
                        {card.supplier_tier.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{card.description}</p>

                  {/* Action buttons */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCardAction("accept", card.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleCardAction("reject", card.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                    {card.pdf_document_path ? (
                      <a
                        href={`http://34.235.125.104:8000/quotes/${card.id}/document`}
                        download={`quote_${card.id}.pdf`}
                        className="block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <div className="block bg-gray-500 text-white py-2 px-4 rounded-lg text-sm font-medium text-center opacity-50 cursor-not-allowed">
                        No PDF Available
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <br /> <br />
            <br />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
            <ChatWindow
              onSend={handleSend}
              assistantName="budgetAdvisorChatbot"
              initialMessage="Hey there! How can I help you today with your budget problems?"
              productId={selectedOption}
            />
          </div>
        </div>
      )}
    </div>
  );
}
