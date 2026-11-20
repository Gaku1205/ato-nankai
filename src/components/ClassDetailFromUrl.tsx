"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClassDetail } from "@/components/ClassDetail";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  return <ClassDetail id={id} />;
}

export function ClassDetailFromUrl() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
