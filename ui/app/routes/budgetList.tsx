import type { Route } from "./+types/login";
import { BudgetList as BudgetListPage } from "../pages/budgets/budgetList";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Budgets" }, { name: "description", content: "Welcome to React Router!" }];
}

export default function BudgetList() {
  return <BudgetListPage />;
}
