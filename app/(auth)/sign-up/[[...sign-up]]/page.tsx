import { SignUp } from "@clerk/nextjs";

export default function Page() {
  // forceRedirectUrl overrides any stored "return-to" URL and the env-var default,
  // guaranteeing newly registered users always land on /onboarding to pick a username.
  return <SignUp forceRedirectUrl="/onboarding" />;
}
