import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from "@/context/AppStateContext";
import ShapeGrid from "@/components/react-bits/ShapeGrid";
import ClickSpark from "@/components/react-bits/ClickSpark";
import SplashScreen from "@/components/ui/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notela — Student Productivity Workspace",
  description: "A calm, intelligent, and glassmorphic academic operating system for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans select-none overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <AppStateProvider>
              {/* Professional SplashScreen */}
              <SplashScreen />
              
              {/* Global Background Layer */}
              <ShapeGrid />
              
              {/* Global Interactive Cursor Effect */}
              <ClickSpark />
              
              {/* App Content */}
              {children}
            </AppStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
