import type { Route } from "./+types/login";
import { EditUser as EditUserPage } from "../pages/users/userEdit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit User" }, { name: "description", content: "Edit User - Supply Chain Management" }];
}

export default function EditUser() {
  return <EditUserPage />;
}