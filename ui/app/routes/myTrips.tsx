import type { Route } from "./+types/home";
import { MyTrips } from "../pages/trucks/myTrips";

export function meta({}: Route.MetaArgs) {
  return [{ title: "My Delivery Trips" }, { name: "description", content: "View your assigned delivery trips" }];
}

export default function MyTripsRoute() {
  return <MyTrips />;
}