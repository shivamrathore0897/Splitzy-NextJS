
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: 'Splitzy',
  description: 'Splitzy makes bill-splitting effortless — just select a category, add amounts and friends, and settle up in seconds. Simple, fair, and frustration-free.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system"enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

