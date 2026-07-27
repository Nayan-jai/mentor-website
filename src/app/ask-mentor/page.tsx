import { redirect } from "next/navigation";

export default function AskMentorPage() {
  redirect("/my-queries?ask=true");
}