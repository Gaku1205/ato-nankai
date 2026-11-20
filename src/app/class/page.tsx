import type { Metadata } from "next";
import { ClassDetailFromUrl } from "@/components/ClassDetailFromUrl";

export const metadata: Metadata = {
  title: "授業の詳細｜あと何回休める？",
};

export default function ClassPage() {
  return <ClassDetailFromUrl />;
}
