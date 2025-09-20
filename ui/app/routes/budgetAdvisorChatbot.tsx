import type { Route } from "./+types/login";
import { BudgetAdvisorChatbot as BudgetAdvisorChatbotPage } from "../pages/budgetAdvisorChatbot";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Food Oracle - Budget Advisor" }, { name: "description", content: "AI-powered budget analysis and recommendations" }];
}

export default function Login() {
  return <BudgetAdvisorChatbotPage />;
}
