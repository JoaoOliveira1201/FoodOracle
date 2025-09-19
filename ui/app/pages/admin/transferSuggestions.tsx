import { useEffect, useMemo, useState } from "react";
import Button from "~/components/Button";
import { useAuth } from "~/contexts/AuthContext";

interface TransferRecord {
  transfer_id: string;
  product_id: number;
  product_name: string;
  product_record_id: number;
  origin_warehouse_id: number;
  origin_warehouse_name: string;
  destination_warehouse_id: number;
  destination_warehouse_name: string;
  quantity_kg: number;
  supplier_id: number;
  quality_classification: string;
  registration_date: string;
  assigned_truck_id?: number | null;
  truck_capacity_kg?: number | null;
  route_total_load_kg?: number | null;
  generated_timestamp: string;
  status: string;
}

interface TransferAction {
  transfer_id: string;
  action: 'placed' | 'discarded';
  timestamp: string;
}

interface ProductSummary {
  product_id: number;
  total_quantity_kg: number;
  number_of_transfers: number;
  trucks_required: number;
}

interface RouteSummary {
  origin_warehouse_id: number;
  destination_warehouse_id: number;
  assigned_truck_id?: number | null;
  route_total_kg: number;
  number_of_records: number;
  number_of_products: number;
}

interface SuggestionResponse {
  success: boolean;
  message: string;
  execution_time_seconds: number;
  results?: any;
  transfer_records: TransferRecord[];
  product_summary: ProductSummary[];
  route_summary: RouteSummary[];
  error?: string;
}

export function TransferSuggestionsPage() {
  const { isAdmin } = useAuth();
  const [maxTrucks, setMaxTrucks] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<SuggestionResponse | null>(null);
  const [transferActions, setTransferActions] = useState<TransferAction[]>([]);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  const canGenerate = useMemo(() => maxTrucks >= 1 && maxTrucks <= 50, [maxTrucks]);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setTransferActions([]);
    try {
      const resp = await fetch("http://localhost:8000/transfer-suggestions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_trucks_to_use: maxTrucks }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      const result: SuggestionResponse = await resp.json();
      setData(result);
      if (!result.success) {
        setError(result.error || result.message || "Failed to generate suggestions");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceTransfer = async (transfer: TransferRecord) => {
    setActionLoading(prev => new Set(prev).add(transfer.transfer_id));
    try {
      const resp = await fetch("http://localhost:8000/warehouse-transfers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_id: transfer.product_record_id,
          origin_warehouse_id: transfer.origin_warehouse_id,
          destination_warehouse_id: transfer.destination_warehouse_id,
          reason: "Optimization",
          notes: `Generated from transfer suggestion`
        }),
      });
      
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      
      const result = await resp.json();
      
      // Mark as placed
      setTransferActions(prev => [...prev, {
        transfer_id: transfer.transfer_id,
        action: 'placed',
        timestamp: new Date().toISOString()
      }]);
      
    } catch (e: any) {
      setError(e?.message || "Failed to place transfer");
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(transfer.transfer_id);
        return newSet;
      });
    }
  };

  const handleDiscardTransfer = (transfer: TransferRecord) => {
    setTransferActions(prev => [...prev, {
      transfer_id: transfer.transfer_id,
      action: 'discarded',
      timestamp: new Date().toISOString()
    }]);
  };

  const getTransferAction = (transferId: string): TransferAction | undefined => {
    return transferActions.find(action => action.transfer_id === transferId);
  };

  if (!isAdmin()) {
    return (
      <div className="px-8 pt-8">
        <div className="p-4 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-md">
          Only administrators can view transfer suggestions.
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Transfer Suggestions</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generate Suggestions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Trucks to Use</label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxTrucks}
              onChange={(e) => setMaxTrucks(parseInt(e.target.value || "0"))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Between 1 and 50</p>
          </div>
          <div className="md:col-span-2">
            <Button label={loading ? "Generating..." : "Generate"} color="primary" onClick={handleGenerate} disabled={loading || !canGenerate} />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
        )}
        {data && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-300">
            <div>Message: {data.message}</div>
            <div>Execution time: {data.execution_time_seconds}s</div>
          </div>
        )}
      </div>

      {data && data.success && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transfer Records</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">{data.transfer_records.length} records</div>
          </div>
          {data.transfer_records.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-gray-500">
              No transfer records suggested.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.transfer_records.map((t) => {
                const action = getTransferAction(t.transfer_id);
                const isActionLoading = actionLoading.has(t.transfer_id);
                
                return (
                  <div key={t.transfer_id} className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-shadow">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{t.transfer_id}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          {new Date(t.generated_timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.product_name}</div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">{t.quantity_kg} kg</div>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mr-2">From {t.origin_warehouse_name}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">To {t.destination_warehouse_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-3">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Supplier #{t.supplier_id}
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {t.quality_classification}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Record #{t.product_record_id}</div>
                        <div className="text-xs">
                          {t.assigned_truck_id ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                              Truck #{t.assigned_truck_id}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">Unassigned</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Status */}
                      {action && (
                        <div className="mb-4 p-2 rounded-md text-xs">
                          {action.action === 'placed' ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>Transfer placed successfully</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                              <span>Transfer discarded</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      {!action && (
                        <div className="flex gap-2">
                          <Button
                            label={isActionLoading ? "Placing..." : "Place Transfer"}
                            color="primary"
                            onClick={() => handlePlaceTransfer(t)}
                            disabled={isActionLoading}
                            size="extra-small"
                          />
                          <Button
                            label="Discard"
                            color="secondary"
                            onClick={() => handleDiscardTransfer(t)}
                            disabled={isActionLoading}
                            size="extra-small"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransferSuggestionsPage;


