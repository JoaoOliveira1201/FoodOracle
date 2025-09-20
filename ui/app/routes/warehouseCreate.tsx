import type { Route } from "./+types/login";
import { CreateWarehouse as CreateWarehousePage } from "../pages/warehouses/warehouseCreate";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create Warehouse" }, { name: "description", content: "Create New Warehouse - Supply Chain Management" }];
}

export default function CreateWarehouse() {
  return <CreateWarehousePage />;
}