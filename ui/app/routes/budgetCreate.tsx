import type { Route } from "./+types/login";
import { CreateBudget as BudgetCreatePage } from "../pages/budgets/budgetCreate";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create Budget" }, { name: "description", content: "Welcome to React Router!" }];
}

export default function BudgetList() {
  return <BudgetCreatePage />;
}
