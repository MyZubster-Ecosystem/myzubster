/**
 * Pet Agent - Powered by Gemma Skills
 * 
 * Skills:
 * - NFC Tag Reading (identify pets)
 * - GPS Tracking (monitor pet locations)
 * - Health Monitoring (track vaccinations & visits)
 * - Lost Pet Recovery (alert system)
 */

class PetAgent {
  constructor(options = {}) {
    this.name = 'PetAgent';
    this.version = '1.0.0';
    this.skills = {
      nfcReading: options.nfcReading || null,
      gpsTracking: options.gpsTracking || null,
      healthMonitoring: options.healthMonitoring || null,
      lostPetRecovery: options.lostPetRecovery || null
    };
    this.memory = options.memory || null;
    this.config = {
      trackingInterval: options.trackingInterval || 300000,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    };
  }

  async readNfcTag(nfcId) {
    if (!this.skills.nfcReading) {
      throw new Error('NFC reading skill not configured');
    }
    try {
      const result = await this.skills.nfcReading.process({
        nfcId,
        validate: true
      });
      if (this.memory) {
        await this.memory.store('nfc-scan', {
          nfcId,
          timestamp: new Date(),
          result
        });
      }
      return result;
    } catch (error) {
      console.error('NFC reading failed:', error);
      throw error;
    }
  }

  async trackLocation(petId, options = {}) {
    if (!this.skills.gpsTracking) {
      throw new Error('GPS tracking skill not configured');
    }
    try {
      const location = await this.skills.gpsTracking.process({
        petId,
        interval: options.interval || this.config.trackingInterval,
        accuracy: options.accuracy || 'high'
      });
      if (this.memory) {
        await this.memory.store('pet-location', {
          petId,
          timestamp: new Date(),
          location
        });
      }
      return location;
    } catch (error) {
      console.error('GPS tracking failed:', error);
      throw error;
    }
  }

  async monitorHealth(petId, options = {}) {
    if (!this.skills.healthMonitoring) {
      throw new Error('Health monitoring skill not configured');
    }
    try {
      const health = await this.skills.healthMonitoring.process({
        petId,
        metrics: options.metrics || ['vaccinations', 'visits', 'medications']
      });
      if (this.memory) {
        await this.memory.store('pet-health', {
          petId,
          timestamp: new Date(),
          health
        });
      }
      return health;
    } catch (error) {
      console.error('Health monitoring failed:', error);
      throw error;
    }
  }

  async lostPetRecovery(petId, options = {}) {
    if (!this.skills.lostPetRecovery) {
      throw new Error('Lost pet recovery skill not configured');
    }
    try {
      const recovery = await this.skills.lostPetRecovery.process({
        petId,
        radius: options.radius || 10,
        alert: options.alert || true
      });
      if (this.memory) {
        await this.memory.store('pet-recovery', {
          petId,
          timestamp: new Date(),
          recovery
        });
      }
      return recovery;
    } catch (error) {
      console.error('Lost pet recovery failed:', error);
      throw error;
    }
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

module.exports = PetAgent;
