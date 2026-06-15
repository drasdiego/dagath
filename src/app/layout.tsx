import type { Metadata } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import HudNav from "@/components/HudNav";
import CephalonDock from "@/components/CephalonDock";
import "./globals.css";

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Dagath",
  description: "Plataforma de inteligência para Warframe",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${chakra.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var z=localStorage.getItem("dagath-zoom");if(z){document.documentElement.style.zoom=z;}var t=localStorage.getItem("dagath-theme");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}var g=localStorage.getItem("dagath-glow");if(g==="low"){document.documentElement.setAttribute("data-glow","low");}}catch(e){}',
          }}
        />
        <HudNav />
        <div className="relative z-10 pt-16">{children}</div>
        <CephalonDock />
      </body>
    </html>
  );
}