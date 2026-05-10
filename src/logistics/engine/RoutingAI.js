class RoutingAI {
  /**
   * Determine the best courier partner based on live rates and logic
   * @param {Object} serviceabilityData Array of couriers from checkServiceability
   * @param {String} optimizationStrategy 'CHEAPEST', 'FASTEST', or 'BALANCED'
   * @returns {Object} Selected courier partner
   */
  static selectBestCourier(serviceabilityData, optimizationStrategy = 'CHEAPEST') {
    if (!serviceabilityData || serviceabilityData.length === 0) {
      throw new Error('No couriers available for this route.');
    }

    // Filter out couriers with high RTO chance or poor performance
    let available = serviceabilityData.filter(c => c.rating > 2.5);

    if (available.length === 0) {
      available = serviceabilityData; // Fallback to all if strict filtering fails
    }

    if (optimizationStrategy === 'CHEAPEST') {
      return available.reduce((prev, curr) => (prev.rate < curr.rate ? prev : curr));
    } 
    
    if (optimizationStrategy === 'FASTEST') {
      return available.reduce((prev, curr) => (prev.estimated_delivery_days < curr.estimated_delivery_days ? prev : curr));
    }

    // Balanced: Good mix of rate and delivery days (e.g., custom score = rate * delivery_days)
    return available.reduce((prev, curr) => {
      const prevScore = prev.rate * prev.estimated_delivery_days;
      const currScore = curr.rate * curr.estimated_delivery_days;
      return prevScore < currScore ? prev : curr;
    });
  }
}

module.exports = RoutingAI;
