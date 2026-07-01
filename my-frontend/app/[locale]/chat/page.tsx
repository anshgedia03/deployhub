import { Metadata } from "next";
import ChatPage from "./components/ChatPage";

export const metadata: Metadata = {
  title: "Chat"
}

export default function Page() {
  return (
    <ChatPage />
  );
}