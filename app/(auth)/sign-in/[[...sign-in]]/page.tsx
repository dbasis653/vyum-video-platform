import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#4ade80",
    colorBackground: "#192512",
    colorInputBackground: "#1f2d1c",
    colorText: "#d4edbb",
    colorTextSecondary: "#7ba86a",
    colorInputText: "#d4edbb",
    colorDanger: "#f87171",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
  },
};

export default function Page() {
  return <SignIn appearance={appearance} />;
}
