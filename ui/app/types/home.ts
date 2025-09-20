export interface Trip {
  trip_id: number;
  truck_id: number | null;
  order_id: number | null;
  origin: {
    latitude: number;
    longitude: number;
  } | null;
  destination: {
    latitude: number;
    longitude: number;
  } | null;
  status: string;
  estimated_time: string | null;
  actual_time: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface WarehouseTransfer {
  transfer_id: number;
  record_id: number | null;
  truck_id: number | null;
  origin_warehouse_id: number | null;
  destination_warehouse_id: number | null;
  status: string;
  reason: string | null;
  requested_date: string | null;
  start_date: string | null;
  completed_date: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  notes: string | null;
}

export interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: {
    latitude: number;
    longitude: number;
  } | null;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

export interface Location {
  latitude: number;
  longitude: number;
}

