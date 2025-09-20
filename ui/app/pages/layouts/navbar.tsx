import { Outlet, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import Button from "~/components/Button";
import { useAuth } from "~/contexts/AuthContext";
import { useCart } from "~/contexts/CartContext";
import { formatRoleDisplayName, getRoleBadgeColor } from "~/helpers/auth";

export default function Navbar() {
  let navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items, totalAmount, removeItem, clear } = useCart();
  const hasItems = items.length > 0;
  const [open, setOpen] = useState(false);

  function LogoutAction() {
    logout();
    navigate("/");
  }

  return (
    <>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl p-4">
          <a
            href="/home"
            className="flex items-center space-x-3 rtl:space-x-reverse group hover:scale-105 transition-transform duration-200 ease-in-out"
          >
            <img
              src="/iconNoBackground.png"
              className="h-12 w-12 group-hover:rotate-12 transition-transform duration-200 ease-in-out"
              alt="Food Oracle Logo"
            />
            <span className="self-center text-2xl font-bold whitespace-nowrap dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 ease-in-out">
              Food Oracle
            </span>
          </a>
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            {/* Cart button only on available-items route */}
            {location.pathname === "/available-items" && (
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-600 text-sm text-white hover:bg-gray-800"
                >
                  Cart {hasItems ? `(${items.length})` : ""}
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-gray-700">
                      <div className="text-sm text-gray-300">Shopping Cart</div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!hasItems ? (
                        <div className="p-4 text-sm text-gray-400">Your cart is empty.</div>
                      ) : (
                        items.map((it) => (
                          <div key={it.recordId} className="p-3 border-b border-gray-800">
                            <div className="flex justify-between text-sm">
                              <div className="text-white">{it.productName}</div>
                              <div className="text-gray-300">#{it.recordId}</div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <div>
                                {it.quantityKg} kg × ${it.pricePerKg}
                              </div>
                              <div>${it.quantityKg * it.pricePerKg}</div>
                            </div>
                            <div className="mt-1 text-right">
                              <button
                                className="text-red-400 hover:text-red-300 text-xs underline"
                                onClick={() => removeItem(it.recordId)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm text-white">
                        <div>Total</div>
                        <div>${totalAmount}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button color="secondary" label="Clear" onClick={() => clear()} />
                        <Button
                          color="primary"
                          label="Checkout"
                          onClick={() => {
                            setOpen(false);
                            navigate("/orders/place");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.name || `User #${user.user_id}`}
                    </div>
                    <div
                      className={`px-3 py-0 text-xs font-medium rounded-full shadow-sm ${getRoleBadgeColor(user.role)}`}
                    >
                      {formatRoleDisplayName(user.role)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Button
              marginClass=""
              label="Logout"
              color="primary-outline"
              onClick={() => {
                LogoutAction();
              }}
            />
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
