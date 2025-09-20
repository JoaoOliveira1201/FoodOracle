import type { Route } from "./+types/login";
import { Login as LoginPage } from "../pages/login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Food Oracle - Login" }, { name: "description", content: "Sign in to Food Oracle supply chain management system" }];
}

export default function Login() {
  return <LoginPage />;
}
