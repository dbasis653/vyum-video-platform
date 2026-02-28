import { SignIn } from "@clerk/nextjs";

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
  return <SignIn appearance={appearance} />;
}
