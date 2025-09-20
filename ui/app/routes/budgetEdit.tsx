import type { Route } from "./+types/login";
import { EditBudget as BudgetEditPage } from "../pages/budgets/budgetEdit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Budget Edit" }, { name: "description", content: "Welcome to React Router!" }];
}

export default function BudgetList() {
  return <BudgetEditPage />;
}
