import type { Route } from "./+types/home";
import { MyTruck } from "../pages/trucks/myTruck";

export function meta({}: Route.MetaArgs) {
  return [{ title: "My Truck" }, { name: "description", content: "Manage your truck information" }];
}

export default function MyTruckRoute() {
  return <MyTruck />;
}