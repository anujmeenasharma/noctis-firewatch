import { Host_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const host = Host_Grotesk({ variable: "--font-host-grotesk", subsets: ["latin"], display: "swap" });
const mono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata = {
  title: "NOCTIS FireWatch — Live fire map and fire seasons for India",
  description:
    "Where is India burning right now? Live NASA satellite fire detections, eight years of fire seasons by state, why satellites count fires differently, and what you can do about smoke and stubble burning.",
};
export const viewport = { themeColor: "#0a0b0d" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${host.variable} ${mono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
