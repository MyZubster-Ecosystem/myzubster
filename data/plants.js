/**
 * Plant Database for Smart Garden
 * 
 * This module provides functions to query and filter the plant database.
 */

const plantsData = require('./plants.json');

class PlantDatabase {
  constructor() {
    this.plants = plantsData.plants;
  }

  /**
   * Get all plants
   * @returns {Array} Array of plant objects
   */
  getAll() {
    return this.plants;
  }

  /**
   * Find a plant by scientific name
   * @param {string} scientificName - The scientific name
   * @returns {Object|null} The plant object or null if not found
   */
  findByScientificName(scientificName) {
    return this.plants.find(p => 
      p.scientificName.toLowerCase() === scientificName.toLowerCase()
    ) || null;
  }

  /**
   * Find plants by common name (partial match)
   * @param {string} commonName - The common name
   * @returns {Array} Array of matching plant objects
   */
  findByCommonName(commonName) {
    return this.plants.filter(p =>
      p.commonName.toLowerCase().includes(commonName.toLowerCase())
    );
  }

  /**
   * Find plants by type
   * @param {string} type - Plant type (fruit, leafy, root, herb, legume, berry, grain, vegetable)
   * @returns {Array} Array of matching plant objects
   */
  findByType(type) {
    return this.plants.filter(p => p.type === type);
  }

  /**
   * Find plants by ideal pH range
   * @param {number} ph - The pH value to check
   * @returns {Array} Array of plants that thrive at this pH
   */
  findByPh(ph) {
    return this.plants.filter(p => 
      ph >= p.idealPhMin && ph <= p.idealPhMax
    );
  }

  /**
   * Find plants by temperature range
   * @param {number} temperature - The temperature in °C
   * @returns {Array} Array of plants that thrive at this temperature
   */
  findByTemperature(temperature) {
    return this.plants.filter(p =>
      temperature >= p.temperatureMin && temperature <= p.temperatureMax
    );
  }

  /**
   * Find plants by EC range
   * @param {number} ec - The electrical conductivity in µS/cm
   * @returns {Array} Array of plants that thrive at this EC
   */
  findByEc(ec) {
    return this.plants.filter(p =>
      ec >= p.idealEcMin && ec <= p.idealEcMax
    );
  }

  /**
   * Find plants by water needs
   * @param {string} waterNeeds - Water needs (low, medium, high)
   * @returns {Array} Array of matching plant objects
   */
  findByWaterNeeds(waterNeeds) {
    return this.plants.filter(p => p.waterNeeds === waterNeeds);
  }

  /**
   * Find plants by sunlight requirement
   * @param {string} sunlight - 'full', 'partial', or 'shade'
   * @returns {Array} Array of matching plants
   */
  findBySunlight(sunlight) {
    return this.plants.filter(p => p.sunlight === sunlight);
  }

  /**
   * Get plants by growth cycle range
   * @param {number} minDays - Minimum days
   * @param {number} maxDays - Maximum days
   * @returns {Array} Array of plants within the range
   */
  findByGrowthCycle(minDays, maxDays) {
    return this.plants.filter(p =>
      p.growthCycleDays >= minDays && p.growthCycleDays <= maxDays
    );
  }

  /**
   * Get plant recommendations based on conditions
   * @param {Object} conditions - { ph, ec, temperature, humidity }
   * @returns {Array} Array of recommended plants (sorted by suitability)
   */
  getRecommendations(conditions) {
    const { ph, ec, temperature } = conditions;
    
    return this.plants
      .map(plant => {
        let score = 0;
        
        // pH suitability (0-3)
        if (ph >= plant.idealPhMin && ph <= plant.idealPhMax) {
          score += 3;
        } else if (ph >= plant.idealPhMin - 0.5 && ph <= plant.idealPhMax + 0.5) {
          score += 1;
        }
        
        // EC suitability (0-3)
        if (ec >= plant.idealEcMin && ec <= plant.idealEcMax) {
          score += 3;
        } else if (ec >= plant.idealEcMin - 0.5 && ec <= plant.idealEcMax + 0.5) {
          score += 1;
        }
        
        // Temperature suitability (0-3)
        if (temperature >= plant.temperatureMin && temperature <= plant.temperatureMax) {
          score += 3;
        } else if (temperature >= plant.temperatureMin - 3 && temperature <= plant.temperatureMax + 3) {
          score += 1;
        }
        
        return { ...plant, score };
      })
      .sort((a, b) => b.score - a.score)
      .filter(p => p.score > 0);
  }

  /**
   * Get the total number of plants
   * @returns {number}
   */
  count() {
    return this.plants.length;
  }

  /**
   * Get all plant types with counts
   * @returns {Object} Object with type as key and count as value
   */
  getTypeStats() {
    const stats = {};
    this.plants.forEach(p => {
      stats[p.type] = (stats[p.type] || 0) + 1;
    });
    return stats;
  }

  /**
   * Export as JSON
   * @returns {Object} The complete database as JSON
   */
  toJSON() {
    return {
      plants: this.plants,
      metadata: {
        total: this.count(),
        types: this.getTypeStats(),
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

// Export a singleton instance
module.exports = new PlantDatabase();
