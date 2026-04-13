import "../globals.css";

export const metadata = {
    title: "Login - StockIQ",
    description: "Login to StockIQ Inventory Management System",
};

export default function LoginLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}