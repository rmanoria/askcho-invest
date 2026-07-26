import "./globals.css";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import Toast from "@/components/Toast";
import Splash from "@/components/Splash";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap"
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata = {
  title: "Competence Asset Management",
  description: "Competence Asset Management \u2014 invest across NGX, NYSE, NASDAQ and fixed income, built for Nigerian investors."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <StoreProvider>
          <Splash />
          {children}
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}