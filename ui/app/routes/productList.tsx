import type { Route } from "./+types/login";
import { ProductList as ProductListPage } from "../pages/products/productList";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Products" }, { name: "description", content: "Product List - Supply Chain Management" }];
}

export default function ProductList() {
  return <ProductListPage />;
}
