import type { Metadata } from "next";
import { ClassDetail } from "@/components/ClassDetail";

export const metadata: Metadata = {
  title: "授業の詳細｜あと何回休める？",
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassDetail id={safeDecode(id)} />;
}
