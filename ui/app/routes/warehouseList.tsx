import type { Route } from "./+types/login";
import { WarehouseList as WarehouseListPage } from "../pages/warehouses/warehouseList";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Warehouses" }, { name: "description", content: "Warehouse List - Supply Chain Management" }];
}

export default function WarehouseList() {
  return <WarehouseListPage />;
}