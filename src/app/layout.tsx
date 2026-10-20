import type { Metadata } from "next";
import { Geist, Geist_Mono, Pixelify_Sans, Press_Start_2P, VT323 } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { PixelTux } from "@/components/Pixel";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const pressStart = Press_Start_2P({ variable: "--font-press-start", weight: "400", subsets: ["latin"] });
const pixelify = Pixelify_Sans({ variable: "--font-pixelify", subsets: ["latin"] });
const vt323 = VT323({ variable: "--font-vt323", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TuxQuest · Aprende comandos Linux jugando",
  description: "Juego web para aprender comandos Linux por familias de distribuciones: Debian, Arch, Red Hat y SUSE.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${pixelify.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <a href="#contenido" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">
            Saltar al contenido
          </a>
          <Header />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <footer className="mt-10 border-t-[3px] border-ink bg-bg-2">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row">
              <span className="flex items-center gap-2 font-game">
                <PixelTux size={22} /> TuxQuest · SENATI · Ingeniería de Software con IA
              </span>
              <span className="font-pixel text-[10px] text-accent">© 2026 · INSERT COIN</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
