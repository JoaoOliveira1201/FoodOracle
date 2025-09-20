import type { Route } from "./+types/login";
import { ProductInfo as ProductInfoPage } from "../pages/products/productInfo";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Product Info" }, { name: "description", content: "Product Information - Supply Chain Management" }];
}

export default function ProductInfo() {
  return <ProductInfoPage />;
}
