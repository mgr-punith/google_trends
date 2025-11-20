// src/app/layout.tsx
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata = {
  title: "Google Trends Alert System",
  description: "Monitor Google Trends and receive alerts in real-time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">GT</span>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Trends Alert
                    </h1>
                  </div>
                  <AuthHeader />
                </div>
              </div>
            </header>
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
        {/* Toast notifications */}
        <Toaster position="top-right" richColors expand={true} />
      </body>
    </html>
  );
}
