/**
 * Verification Agent - Powered by Gemma Skills
 * 
 * Skills:
 * - Plant Verification
 * - Pet Verification
 * - Community Voting Analysis
 * - Quality Score Calculation
 */

class VerificationAgent {
  constructor(options = {}) {
    this.name = 'VerificationAgent';
    this.version = '1.0.0';
    this.skills = {
      plantVerification: options.plantVerification || null,
      petVerification: options.petVerification || null,
      communityVoting: options.communityVoting || null,
      qualityScoring: options.qualityScoring || null
    };
    this.memory = options.memory || null;
    this.config = {
      minVotes: options.minVotes || 5,
      threshold: options.threshold || 0.7,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    };
  }

  async verifyPlant(plantData, options = {}) {
    if (!this.skills.plantVerification) {
      throw new Error('Plant verification skill not configured');
    }
    try {
      const result = await this.skills.plantVerification.process({
        data: plantData,
        confidence: options.confidence || this.config.threshold,
        sources: options.sources || ['gps', 'photos', 'community']
      });
      if (this.memory) {
        await this.memory.store('plant-verification', {
          plantId: plantData.id || 'unknown',
          result,
          timestamp: new Date()
        });
      }
      return result;
    } catch (error) {
      console.error('Plant verification failed:', error);
      throw error;
    }
  }

  async verifyPet(petData, options = {}) {
    if (!this.skills.petVerification) {
      throw new Error('Pet verification skill not configured');
    }
    try {
      const result = await this.skills.petVerification.process({
        data: petData,
        confidence: options.confidence || this.config.threshold,
        sources: options.sources || ['nfc', 'gps', 'photos']
      });
      if (this.memory) {
        await this.memory.store('pet-verification', {
          petId: petData.id || 'unknown',
          result,
          timestamp: new Date()
        });
      }
      return result;
    } catch (error) {
      console.error('Pet verification failed:', error);
      throw error;
    }
  }

  async analyzeCommunityVotes(itemId, votes, options = {}) {
    if (!this.skills.communityVoting) {
      const total = votes.length;
      const positive = votes.filter(v => v === 'upvote').length;
      const score = total > 0 ? positive / total : 0;
      return {
        itemId,
        totalVotes: total,
        positiveVotes: positive,
        negativeVotes: total - positive,
        score,
        status: score >= this.config.threshold ? 'verified' : 'pending'
      };
    }
    try {
      const result = await this.skills.communityVoting.process({
        itemId,
        votes,
        threshold: options.threshold || this.config.threshold
      });
      if (this.memory) {
        await this.memory.store('community-voting', {
          itemId,
          votes,
          result,
          timestamp: new Date()
        });
      }
      return result;
    } catch (error) {
      console.error('Community voting analysis failed:', error);
      throw error;
    }
  }

  async calculateQualityScore(data, options = {}) {
    if (!this.skills.qualityScoring) {
      const score = this.calculateFallbackScore(data);
      return {
        score,
        status: score >= this.config.threshold ? 'high' : 'low',
        details: {
          dataQuality: 'basic',
          completeness: 'partial'
        }
      };
    }
    try {
      const result = await this.skills.qualityScoring.process({
        data,
        metrics: options.metrics || ['completeness', 'accuracy', 'freshness']
      });
      if (this.memory) {
        await this.memory.store('quality-score', {
          dataId: data.id || 'unknown',
          result,
          timestamp: new Date()
        });
      }
      return result;
    } catch (error) {
      console.error('Quality scoring failed:', error);
      throw error;
    }
  }

  calculateFallbackScore(data) {
    let score = 0;
    const fields = Object.keys(data);
    const filledFields = fields.filter(f => data[f] !== null && data[f] !== undefined);
    const completeness = fields.length > 0 ? filledFields.length / fields.length : 0;
    const hasPhotos = data.photos && data.photos.length > 0;
    const hasGPS = data.gps && data.gps.lat && data.gps.lng;
    score = (completeness * 0.5) + (hasPhotos ? 0.3 : 0) + (hasGPS ? 0.2 : 0);
    return Math.round(score * 100) / 100;
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

module.exports = VerificationAgent;
