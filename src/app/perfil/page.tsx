import { Suspense } from "react";
import { Profile } from "./Profile";

export default function Page() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
