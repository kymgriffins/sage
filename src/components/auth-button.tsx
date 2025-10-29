"use client";

import { Button } from "@/components/ui/button";
import { UserButton, useStackApp, useUser } from "@stackframe/stack";

export function AuthButton() {
  const user = useUser();
  const app = useStackApp();

  const handleSignIn = () => {
    app.redirectToSignIn();
  };

  if (user) {
    return <UserButton />;
  }

  return (
    <Button variant="outline" onClick={handleSignIn}>
      Sign In
    </Button>
  );
}
