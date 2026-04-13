/**
 * IP GEOLOCATION TRACKER
 * Simple IP geolocation service for tracking user locations
 */

const https = require('https');

class IPGeolocationTracker {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Get location data from IP address
     */
    async getLocationData(ipAddress) {
        try {
            // Handle localhost and private IPs
            if (!ipAddress || 
                ipAddress === '127.0.0.1' || 
                ipAddress === '::1' || 
                ipAddress.startsWith('192.168.') ||
                ipAddress.startsWith('10.') ||
                ipAddress.startsWith('172.')) {
                return {
                    city: 'Local',
                    region: 'Local Network',
                    country: 'Local',
                    ip: ipAddress
                };
            }

            // Check cache first
            const cacheKey = ipAddress;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            // Try to get location from free IP API
            const locationData = await this.fetchLocationFromAPI(ipAddress);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: locationData,
                timestamp: Date.now()
            });

            return locationData;

        } catch (error) {
            console.error('Geolocation error:', error.message);
            return {
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown',
                ip: ipAddress
            };
        }
    }

    /**
     * Fetch location from free IP API
     */
    async fetchLocationFromAPI(ipAddress) {
        return new Promise((resolve, reject) => {
            // Using ip-api.com (free, no API key required)
            const url = `http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,query`;
            
            const request = https.get(url.replace('http:', 'https:'), (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        
                        if (result.status === 'success') {
                            resolve({
                                city: result.city || 'Unknown City',
                                region: result.regionName || 'Unknown Region',
                                country: result.country || 'Unknown Country',
                                ip: result.query || ipAddress
                            });
                        } else {
                            // Fallback for failed API calls
                            resolve({
                                city: 'Unknown City',
                                region: 'Unknown Region', 
                                country: 'Unknown Country',
                                ip: ipAddress
                            });
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });
            
            request.on('error', (error) => {
                // Fallback for network errors
                resolve({
                    city: 'Network Error',
                    region: 'Network Error',
                    country: 'Network Error',
                    ip: ipAddress
                });
            });
            
            request.setTimeout(5000, () => {
                request.destroy();
                resolve({
                    city: 'Timeout',
                    region: 'Timeout',
                    country: 'Timeout',
                    ip: ipAddress
                });
            });
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Geolocation cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

module.exports = IPGeolocationTracker;