import type { Metadata } from "next";
import { SettingsView } from "@/components/SettingsView";

export const metadata: Metadata = {
  title: "設定｜あと何回休める？",
};

export default function SettingsPage() {
  return <SettingsView />;
}
