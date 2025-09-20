import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";
import { ChatWindow } from "~/components/ChatWindow";
import { useAuth } from "~/contexts/AuthContext";
import { useCart } from "~/contexts/CartContext";

interface BuyerStockItem {
  record_id: number;
  product_id: number;
  product_name: string;
  warehouse_id: number | null;
  quantity_kg: number | null;
  quality_classification: string | null;
  original_price: number | null;
  current_price: number | null;
  discount_percentage: number | null;
  requires_refrigeration: boolean;
  days_until_expiry: number | null;
  is_discounted: boolean;
  image_path?: string | null;
  registration_date: string | null;
}

interface BuyerStockResponse {
  available_items: BuyerStockItem[];
  total_items: number;
  total_quantity_kg: number;
}

export function AvailableItems() {
  const navigate = useNavigate();
  const { isBuyer, user } = useAuth();
  const { addItem, items: cartItems } = useCart();
  const [data, setData] = useState<BuyerStockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [chatKey, setChatKey] = useState(0); // Used to reset chat window

  // Function to clear chat history
  async function clearChatHistory() {
    if (!user?.user_id) return;
    
    try {
      await fetch(`http://34.235.125.104:8000/client-advisor/clear-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      
      // Reset chat window by changing key
      setChatKey(prev => prev + 1);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }

  // Chat handler function using the client advisor API
  async function handleChatSend(userMessage: string, productId: string): Promise<string> {
    if (!user?.user_id) {
      return "Please log in to get personalized shopping advice.";
    }

    try {
      let response;
      
      // Check if this is a product-specific question
      if (selectedProductId && productId !== "available-items") {
        // Product-specific question
        response = await fetch(`http://34.235.125.104:8000/client-advisor/ask-product?user_id=${user.user_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: selectedProductId,
            query: userMessage
          }),
        });
      } else {
        // General question about available items
        response = await fetch(`http://34.235.125.104:8000/client-advisor/ask?user_id=${user.user_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.answer || "I'm sorry, I couldn't process your question right now.";
    } catch (error) {
      console.error("Error calling client advisor:", error);
      return "I'm sorry, I'm having trouble connecting to my services right now. Please try again later.";
    }
  }

  useEffect(() => {
    async function fetchAvailable() {
      try {
        setLoading(true);
        // Use the dedicated buyer endpoint that handles all calculations server-side
        const resp = await fetch("http://34.235.125.104:8000/product-records/buyer/available-items");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buyerStock: BuyerStockResponse = await resp.json();
        
        setData(buyerStock);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch available items");
      } finally {
        setLoading(false);
      }
    }
    fetchAvailable();
  }, []);

  // Reset chat when product selection changes
  useEffect(() => {
    setChatKey(prev => prev + 1);
  }, [selectedProductId]);

  const filtered = useMemo<BuyerStockItem[]>(() => {
    let items: BuyerStockItem[] = data?.available_items ?? [];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((i: BuyerStockItem) => i.product_name.toLowerCase().includes(q));
    }
    return items;
  }, [data, query]);

  if (!isBuyer()) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-md">
          Only buyers can view available items.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading available items...</span>
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
    <div className="px-8 pt-8 h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">Available Items</h1>
      </div>

      {/* Split Layout Container */}
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* LEFT SECTION - Product List */}
        <div className="w-2/3 flex flex-col">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white flex-1"
            />
          </div>

          <div className="relative overflow-auto shadow-md sm:rounded-lg border border-gray-600 flex-1">
            <table className="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                <tr>
                  <th className="px-3 py-2 w-1/5">Product</th>
                  <th className="px-2 py-2 w-16">#</th>
                  <th className="px-2 py-2 w-20">Qty (kg)</th>
                  <th className="px-2 py-2 w-20">Quality</th>
                  <th className="px-3 py-2 w-24">Price</th>
                  <th className="px-2 py-2 w-16">Cold</th>
                  <th className="px-2 py-2 w-16">Days</th>
                  <th className="px-2 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr
                      key={item.record_id}
                      className={`${idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <td className="px-3 py-2">
                        <div 
                          className={`font-medium text-sm truncate cursor-pointer transition-colors ${
                            selectedProductId === item.product_id 
                              ? "text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded" 
                              : "text-white hover:text-indigo-300"
                          }`}
                          title={`${item.product_name} - Click to get personalized advice about this product`}
                          onClick={() => {
                            if (selectedProductId === item.product_id) {
                              setSelectedProductId(null);
                            } else {
                              setSelectedProductId(item.product_id);
                            }
                          }}
                        >
                          {selectedProductId === item.product_id && "🎯 "}{item.product_name}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-400">#{item.record_id}</td>
                      <td className="px-2 py-2 text-center">{item.quantity_kg ?? "-"}</td>
                      <td className="px-2 py-2">{item.quality_classification ?? "-"}</td>
                      <td className="px-3 py-2">
                        {item.current_price != null ? (
                          <div className="text-center">
                            {item.is_discounted && item.original_price != null ? (
                              <>
                                <div className="line-through text-gray-400 text-xs">${item.original_price}</div>
                                <div className="font-bold text-green-400 text-sm">${item.current_price}</div>
                                <div className="text-green-400 text-xs">-{item.discount_percentage}%</div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-white text-sm">${item.current_price}</div>
                                <div className="text-gray-400 text-xs">per kg</div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {item.requires_refrigeration ? (
                          <div className="w-4 h-4 mx-auto bg-blue-500 rounded-full flex items-center justify-center" title="Requires refrigeration">
                            <span className="text-white text-xs">❄</span>
                          </div>
                        ) : (
                          <div className="w-4 h-4 mx-auto bg-gray-600 rounded-full" title="No refrigeration needed"></div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`text-sm ${item.days_until_expiry != null && item.days_until_expiry <= 3 ? "text-red-400 font-bold" : item.days_until_expiry != null && item.days_until_expiry <= 7 ? "text-yellow-400" : "text-gray-300"}`}>
                          {item.days_until_expiry ?? "-"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => {
                            if (cartItems.some((c) => c.recordId === item.record_id)) return;
                            addItem({
                              recordId: item.record_id,
                              productId: item.product_id,
                              productName: item.product_name,
                              quantityKg: item.quantity_kg ?? 1,
                              pricePerKg: item.current_price ?? 0,
                            });
                          }}
                          disabled={cartItems.some((c) => c.recordId === item.record_id)}
                          className={`p-2 rounded-full transition-all ${
                            cartItems.some((c) => c.recordId === item.record_id)
                              ? "bg-green-600 text-white cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-110"
                          }`}
                          title={cartItems.some((c) => c.recordId === item.record_id) ? "Added to cart" : "Add to cart"}
                        >
                          {cartItems.some((c) => c.recordId === item.record_id) ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SECTION - Chat Window */}
        <div className="w-1/3 border-l border-gray-600 pl-6">
          {selectedProductId ? (
            <div className="mb-4 p-3 bg-indigo-900/30 border border-indigo-600 rounded-md">
              <div className="text-sm text-indigo-300">🎯 Product-Specific Mode</div>
              <div className="text-xs text-gray-400 mt-1">
                Asking about: {filtered.find(item => item.product_id === selectedProductId)?.product_name}
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setSelectedProductId(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                  Switch to general questions
                </button>
                <button 
                  onClick={clearChatHistory}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear chat history
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded-md">
              <div className="text-sm text-gray-300">💬 General Shopping Mode</div>
              <div className="text-xs text-gray-400 mt-1">
                Click on any product name to get specific advice about that item
              </div>
              <button 
                onClick={clearChatHistory}
                className="text-xs text-red-400 hover:text-red-300 underline mt-2"
              >
                Clear chat history
              </button>
            </div>
          )}
          <ChatWindow
            key={chatKey} // This will reset the component when chatKey changes
            onSend={handleChatSend}
            assistantName="AI Shopping Assistant"
            initialMessage={selectedProductId 
              ? `Hi! I'm your AI shopping assistant. I can see you're interested in ${filtered.find(item => item.product_id === selectedProductId)?.product_name}. Ask me anything about this product - pricing, quality, storage, or whether it's a good fit for your needs!`
              : "Hi! I'm your AI shopping assistant with access to your purchase history and preferences. Ask me about available items, pricing, quality, storage requirements, or get personalized recommendations based on your buying patterns!"
            }
            productId={selectedProductId ? selectedProductId.toString() : "available-items"}
          />
        </div>
      </div>
    </div>
  );
}

export default AvailableItems;


