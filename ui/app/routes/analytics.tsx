import type { Route } from "./+types/analytics";
import { Analytics as AnalyticsPage } from "../pages/analytics";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Analytics Dashboard" }, { name: "description", content: "Comprehensive platform metrics and performance insights" }];
}

export default function Analytics() {
  return <AnalyticsPage />;
}