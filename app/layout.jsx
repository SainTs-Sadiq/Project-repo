import AuthGate from "../components/AuthGate";
import VendorCta from "../components/VendorCta";

export const metadata = {
  title: "Food Procurement Intelligence",
  description: "AI-powered personalized meal planning and grocery optimization."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthGate>{children}</AuthGate><VendorCta /></body></html>;
}
