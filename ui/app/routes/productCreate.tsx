import type { Route } from "./+types/login";
import { CreateProduct as CreateProductPage } from "../pages/products/productCreate";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create Product" }, { name: "description", content: "Create New Product - Supply Chain Management" }];
}

export default function CreateProduct() {
  return <CreateProductPage />;
}
