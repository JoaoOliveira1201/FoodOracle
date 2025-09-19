import { Route } from "@react-router/dev/routes";
import TransferSuggestionsPage from "~/pages/admin/transferSuggestions";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Food Oracle - Transfer Suggestions" },
    { name: "description", content: "AI transfer suggestions for redistribution" },
  ];
}

export default function TransferSuggestionsRoute() {
  return <TransferSuggestionsPage />;
}


