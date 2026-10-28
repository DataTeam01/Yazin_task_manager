"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Something went wrong"
      description="The page couldn't load. Check your connection and Supabase settings, then try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
