import MarketplaceDashboard from "@/app/marketplace/MarketplaceDashboard";

export default function AmazonIntegrationPage() {
    return (
        <MarketplaceDashboard
            marketplace={{
                name: "Amazon",
                badge: "Marketplace Channel",
                color: "#f59e0b",
                description: "List dashboard products to Amazon, monitor catalog readiness, and track marketplace orders from one control surface."
            }}
        />
    );
}
