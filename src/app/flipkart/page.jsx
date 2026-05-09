import MarketplaceDashboard from "@/app/marketplace/MarketplaceDashboard";

export default function FlipkartIntegrationPage() {
    return (
        <MarketplaceDashboard
            marketplace={{
                name: "Flipkart",
                badge: "Marketplace Channel",
                color: "#2874f0",
                description: "Publish dashboard products to Flipkart, manage listing readiness, and track marketplace order movement in an MVP SaaS workflow."
            }}
        />
    );
}
