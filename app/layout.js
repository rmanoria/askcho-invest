import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Toast from "@/components/Toast";

export const metadata = {
  title: "ASKCHO Invest",
  description: "Invest across NGX, NYSE, NASDAQ and fixed income \u2014 built for Nigerian investors."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
