import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="That page doesn't exist."
      action={
        <Button asChild>
          <Link href="/">Back to the board</Link>
        </Button>
      }
    />
  );
}
