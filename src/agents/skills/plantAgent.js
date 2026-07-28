/**
 * Plant Agent - Powered by Gemma Skills
 * 
 * Skills:
 * - Plant Recognition (identify species from photos)
 * - Growth Monitoring (track plant health)
 * - Verification (validate plant registrations)
 * - Conservation Impact (measure environmental benefits)
 */

class PlantAgent {
  constructor(options = {}) {
    this.name = 'PlantAgent';
    this.version = '1.0.0';
    this.skills = {
      recognition: options.recognition || null,
      monitoring: options.monitoring || null,
      verification: options.verification || null,
      conservation: options.conservation || null
    };
    this.memory = options.memory || null;
    this.config = {
      confidenceThreshold: options.confidenceThreshold || 0.85,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    };
  }

  async identifyPlant(photo, options = {}) {
    if (!this.skills.recognition) {
      throw new Error('Plant recognition skill not configured');
    }
    try {
      const result = await this.skills.recognition.process({
        image: photo,
        confidence: this.config.confidenceThreshold,
        ...options
      });
      if (this.memory) {
        await this.memory.store('plant-recognition', {
          timestamp: new Date(),
          result,
          photoHash: this.hashPhoto(photo)
        });
      }
      return result;
    } catch (error) {
      console.error('Plant recognition failed:', error);
      throw error;
    }
  }

  async monitorGrowth(plantId, options = {}) {
    if (!this.skills.monitoring) {
      throw new Error('Growth monitoring skill not configured');
    }
    try {
      const data = await this.skills.monitoring.process({
        plantId,
        timeRange: options.timeRange || '30d',
        metrics: options.metrics || ['height', 'health', 'photos']
      });
      if (this.memory) {
        await this.memory.store('plant-growth', {
          plantId,
          timestamp: new Date(),
          data
        });
      }
      return data;
    } catch (error) {
      console.error('Growth monitoring failed:', error);
      throw error;
    }
  }

  async verifyPlant(registrationData) {
    if (!this.skills.verification) {
      throw new Error('Verification skill not configured');
    }
    try {
      const result = await this.skills.verification.process({
        data: registrationData,
        confidence: this.config.confidenceThreshold
      });
      return result;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  }

  async calculateConservationImpact(plantId) {
    if (!this.skills.conservation) {
      throw new Error('Conservation skill not configured');
    }
    try {
      const impact = await this.skills.conservation.process({
        plantId,
        metrics: ['carbonOffset', 'biodiversity', 'waterConservation']
      });
      return impact;
    } catch (error) {
      console.error('Conservation calculation failed:', error);
      throw error;
    }
  }

  hashPhoto(photo) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(photo).digest('hex');
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      skills: Object.keys(this.skills).filter(k => this.skills[k] !== null),
      memory: this.memory ? 'connected' : 'disabled',
      config: this.config
    };
  }
}

module.exports = PlantAgent;
