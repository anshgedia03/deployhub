import HomePage from "./components/HomePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home"
}

export default function Page() {  
  return (
    <HomePage />
  );
}