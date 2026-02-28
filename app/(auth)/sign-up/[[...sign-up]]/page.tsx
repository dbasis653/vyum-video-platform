import { SignUp } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#3B82F6",
    colorBackground: "#0f1929",
    colorInputBackground: "#132033",
    colorText: "#bfdbfe",
    colorTextSecondary: "#60a5fa",
    colorInputText: "#bfdbfe",
    colorDanger: "#f87171",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
  },
};

export default function Page() {
  // forceRedirectUrl overrides any stored "return-to" URL and the env-var default,
  // guaranteeing newly registered users always land on /onboarding to pick a username.
  return <SignUp forceRedirectUrl="/onboarding" appearance={appearance} />;
}
