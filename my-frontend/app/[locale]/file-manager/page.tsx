import { Metadata } from "next";
import FileManagerPage from "./components/FileManagerPage";

export const metadata: Metadata = {
    title: "File Manager"
}
export default function Page() {
    return (
        <FileManagerPage />
    );
}