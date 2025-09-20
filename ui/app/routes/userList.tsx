import type { Route } from "./+types/login";
import { UserList as UserListPage } from "../pages/users/userList";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Users" }, { name: "description", content: "User List - Supply Chain Management" }];
}

export default function UserList() {
  return <UserListPage />;
}