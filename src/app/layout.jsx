import "./globals.css";
import "react-chat-elements/dist/main.css";

import ClientLayout from "./layout.client";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata = {
    title: "hunyhuny - Smart Inventory Solutions",
    description: "Professional inventory management system with modern UI",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="light">
        <body className="page-container">
        <ThemeProvider>
            <AuthProvider>
                <PermissionsProvider>
                    <ClientLayout>
                        <div className="content-wrapper">
                            {children}
                        </div>
                    </ClientLayout>
                </PermissionsProvider>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
