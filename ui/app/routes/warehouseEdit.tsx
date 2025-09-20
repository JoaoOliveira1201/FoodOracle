import type { Route } from "./+types/login";
import { EditWarehouse as EditWarehousePage } from "../pages/warehouses/warehouseEdit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Warehouse" }, { name: "description", content: "Edit Warehouse - Supply Chain Management" }];
}

export default function EditWarehouse() {
  return <EditWarehousePage />;
}