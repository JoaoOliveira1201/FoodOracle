import type { Route } from "./+types/login";
import { UserInfo as UserInfoPage } from "../pages/users/userInfo";

export function meta({}: Route.MetaArgs) {
  return [{ title: "User Info" }, { name: "description", content: "User Information - Supply Chain Management" }];
}

export default function UserInfo() {
  return <UserInfoPage />;
}