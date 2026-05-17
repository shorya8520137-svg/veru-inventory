import "./globals.css";
import "react-chat-elements/dist/main.css";

import ClientLayout from "./layout.client";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata = {
    title: "insora.in - AI Operations Platform",
    description: "insora.in builds AI-powered inventory, warehouse, marketplace, delivery, billing, support, and operations systems.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="page-container">
        <ThemeProvider>
            <AuthProvider>
                <PermissionsProvider>
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </PermissionsProvider>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
