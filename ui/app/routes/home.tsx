import type { Route } from "./+types/home";
import { Home as HomePage } from "../pages/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Food Oracle - Dashboard" }, { name: "description", content: "AI-powered supply chain management dashboard" }];
}

export default function Home() {
  return <HomePage />;
}
