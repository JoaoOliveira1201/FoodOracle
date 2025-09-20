import type { Route } from "./+types/home";
import { MyTransfers } from "../pages/trucks/myTransfers";

export function meta({}: Route.MetaArgs) {
  return [{ title: "My Warehouse Transfers" }, { name: "description", content: "View your assigned warehouse transfers" }];
}

export default function MyTransfersRoute() {
  return <MyTransfers />;
}