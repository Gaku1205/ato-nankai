import type { Metadata } from "next";
import { TimetableGrid } from "@/components/TimetableGrid";

export const metadata: Metadata = {
  title: "時間割｜あと何回休める？",
};

export default function TimetablePage() {
  return <TimetableGrid />;
}
