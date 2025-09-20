import type { Route } from "./+types/login";
import { EditProduct as EditProductPage } from "../pages/products/productEdit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Product" }, { name: "description", content: "Edit Product - Supply Chain Management" }];
}

export default function EditProduct() {
  return <EditProductPage />;
}
