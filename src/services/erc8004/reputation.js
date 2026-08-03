/**
 * ERC-8004 Reputation Service
 * Gestisce la reputazione on-chain dei robot
 */

class ReputationService {
  constructor() {
    this.reputations = new Map();
  }

  async mintSoulboundNFT(robotId, walletAddress, scores) {
    try {
      const nft = {
        id: `nft_${robotId}_${Date.now()}`,
        robotId,
        walletAddress,
        scores: {
          punctuality: scores.punctuality || 0,
          quality: scores.quality || 0,
          reliability: scores.reliability || 0,
          overall: this.calculateOverall(scores)
        },
        metadata: {
          name: `MyZubster Robot NFT #${robotId}`,
          description: `Reputazione on-chain per robot ${robotId}`,
          image: `https://myzubster.com/nft/${robotId}.png`
        },
        createdAt: new Date().toISOString(),
        soulbound: true
      };
      
      this.reputations.set(nft.id, nft);
      console.log(`✅ NFT Soulbound creato per robot ${robotId}`);
      return nft;
    } catch (error) {
      console.error('❌ Errore minting NFT:', error.message);
      throw error;
    }
  }

  calculateOverall(scores) {
    const weights = {
      punctuality: 0.3,
      quality: 0.4,
      reliability: 0.3
    };
    
    let overall = 0;
    for (const [key, weight] of Object.entries(weights)) {
      overall += (scores[key] || 0) * weight;
    }
    
    return Math.min(100, Math.max(0, Math.round(overall)));
  }

  async addReview(robotId, review) {
    try {
      const reviewData = {
        id: `rev_${robotId}_${Date.now()}`,
        robotId,
        reviewer: review.reviewer || '0xAnonymous',
        rating: review.rating || 5,
        comment: review.comment || '',
        categories: {
          punctuality: review.punctuality || 5,
          quality: review.quality || 5,
          reliability: review.reliability || 5
        },
        createdAt: new Date().toISOString()
      };
      
      const nft = this.reputations.get(`nft_${robotId}`);
      if (nft) {
        const scores = {
          punctuality: (nft.scores.punctuality + reviewData.categories.punctuality) / 2,
          quality: (nft.scores.quality + reviewData.categories.quality) / 2,
          reliability: (nft.scores.reliability + reviewData.categories.reliability) / 2
        };
        nft.scores = {
          ...scores,
          overall: this.calculateOverall(scores)
        };
        this.reputations.set(`nft_${robotId}`, nft);
      }
      
      console.log(`✅ Recensione aggiunta per robot ${robotId}`);
      return reviewData;
    } catch (error) {
      console.error('❌ Errore aggiunta recensione:', error.message);
      throw error;
    }
  }

  async getReputation(robotId) {
    try {
      const nft = this.reputations.get(`nft_${robotId}`);
      if (!nft) {
        return {
          robotId,
          exists: false,
          score: 0,
          message: 'Nessuna reputazione trovata'
        };
      }
      
      return {
        robotId,
        exists: true,
        score: nft.scores.overall,
        scores: nft.scores,
        metadata: nft.metadata,
        soulbound: nft.soulbound
      };
    } catch (error) {
      console.error('❌ Errore recupero reputazione:', error.message);
      throw error;
    }
  }
}

module.exports = new ReputationService();
