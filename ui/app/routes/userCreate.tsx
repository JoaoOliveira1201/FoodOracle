import type { Route } from "./+types/login";
import { CreateUser as CreateUserPage } from "../pages/users/userCreate";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create User" }, { name: "description", content: "Create New User - Supply Chain Management" }];
}

export default function CreateUser() {
  return <CreateUserPage />;
}