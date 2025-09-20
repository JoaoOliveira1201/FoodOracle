import type { Route } from "./+types/login";
import { WarehouseInfo as WarehouseInfoPage } from "../pages/warehouses/warehouseInfo";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Warehouse Info" }, { name: "description", content: "Warehouse Information - Supply Chain Management" }];
}

export default function WarehouseInfo() {
  return <WarehouseInfoPage />;
}