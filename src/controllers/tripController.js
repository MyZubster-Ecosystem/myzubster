const Trip = require('../models/Trip');

// Saldo utenti (condiviso con githubWebhookController)
const users = {
  'DanielIoni-creator': { walletAddress: '45M4DW1ug8bdQowWpxucTpgsfjLbVxbYaAra79VewmBobuuhgqTjyD4R3DzpqLM2veiphcB16n24qN1QbLg3y2PYGK3Qkoe', myzBalance: 100 }
};

const REWARD_PER_KM = 0.2;     // MYZ per km
const MILESTONE_KM = 100;      // km per milestone
const MILESTONE_BONUS = 10;    // MYZ bonus per milestone

module.exports = {
  // Registra una tratta completata
  completeTrip: async (req, res) => {
    try {
      const { userId, escrowId, distanceKm, durationMin, startLocation, endLocation, scooterId } = req.body;

      if (!userId || !distanceKm || distanceKm <= 0) {
        return res.status(400).json({ error: 'userId e distanceKm (positivo) sono obbligatori' });
      }

      // Calcola la ricompensa base
      const rewardMYZ = Math.round(distanceKm * REWARD_PER_KM * 100) / 100;

      // Salva la tratta
      const trip = new Trip({
        escrowId,
        userId,
        distanceKm,
        durationMin: durationMin || 0,
        startLocation: startLocation || null,
        endLocation: endLocation || null,
        rewardMYZ,
        scooterId: scooterId || 'UNKNOWN'
      });

      await trip.save();

      // Aggiungi MYZ al saldo dell'utente
      if (!users[userId]) {
        users[userId] = { walletAddress: '', myzBalance: 0 };
      }
      users[userId].myzBalance = (users[userId].myzBalance || 0) + rewardMYZ;

      // Calcola il totale km dell'utente
      const totalKmResult = await Trip.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$distanceKm' } } }
      ]);
      const totalKm = totalKmResult.length > 0 ? totalKmResult[0].total : 0;

      // Controlla se ha raggiunto una milestone
      let bonusMYZ = 0;
      const currentMilestone = Math.floor(totalKm / MILESTONE_KM);
      const previousMilestone = Math.floor((totalKm - distanceKm) / MILESTONE_KM);

      if (currentMilestone > previousMilestone && currentMilestone >= 1) {
        bonusMYZ = MILESTONE_BONUS * (currentMilestone - previousMilestone);
        users[userId].myzBalance += bonusMYZ;
      }

      // Aggiorna la tratta con bonus e totale
      trip.bonusMYZ = bonusMYZ;
      trip.totalMYZ = rewardMYZ + bonusMYZ;
      await trip.save();

      res.json({
        success: true,
        trip: {
          id: trip._id,
          distanceKm,
          rewardMYZ,
          bonusMYZ,
          totalMYZ: rewardMYZ + bonusMYZ,
          totalKm: totalKm,
          newBalance: users[userId].myzBalance
        }
      });

    } catch (error) {
      console.error('❌ Errore registrazione tratta:', error);
      res.status(500).json({ error: 'Errore interno', message: error.message });
    }
  },

  // Ottieni lo storico tratte di un utente
  getUserTrips: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const trips = await Trip.find({ userId })
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));

      const totalKmResult = await Trip.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$distanceKm' } } }
      ]);
      const totalKm = totalKmResult.length > 0 ? totalKmResult[0].total : 0;

      const totalTrips = await Trip.countDocuments({ userId });

      res.json({
        success: true,
        totalKm,
        totalTrips,
        trips
      });

    } catch (error) {
      console.error('❌ Errore recupero tratte:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  },

  // Ottieni le statistiche di un utente
  getUserStats: async (req, res) => {
    try {
      const { userId } = req.params;

      const totalKmResult = await Trip.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$distanceKm' } } }
      ]);
      const totalKm = totalKmResult.length > 0 ? totalKmResult[0].total : 0;

      const totalRewardsResult = await Trip.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$totalMYZ' } } }
      ]);
      const totalMYZ = totalRewardsResult.length > 0 ? totalRewardsResult[0].total : 0;

      const totalTrips = await Trip.countDocuments({ userId });

      const milestones = Math.floor(totalKm / MILESTONE_KM);

      res.json({
        success: true,
        stats: {
          totalKm,
          totalMYZ,
          totalTrips,
          milestones,
          nextMilestone: (milestones + 1) * MILESTONE_KM,
          kmToNextMilestone: (milestones + 1) * MILESTONE_KM - totalKm
        }
      });

    } catch (error) {
      console.error('❌ Errore recupero statistiche:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  },

  // Webhook per ricevere dati GPS dal monopattino
  gpsWebhook: async (req, res) => {
    try {
      const { scooterId, userId, lat, lng, distanceKm, durationMin } = req.body;

      if (!scooterId || !userId || !distanceKm) {
        return res.status(400).json({ error: 'scooterId, userId e distanceKm sono obbligatori' });
      }

      // Registra la tratta automaticamente
      const result = await module.exports.completeTrip({
        body: { userId, distanceKm, durationMin, startLocation: { lat, lng }, scooterId }
      }, res);

      return result;

    } catch (error) {
      console.error('❌ Errore GPS webhook:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  },

  // Ottieni la classifica (leaderboard)
  getLeaderboard: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const leaderboard = await Trip.aggregate([
        { $group: { 
          _id: '$userId', 
          totalKm: { $sum: '$distanceKm' },
          totalMYZ: { $sum: '$totalMYZ' },
          totalTrips: { $sum: 1 }
        }},
        { $sort: { totalKm: -1 } },
        { $limit: parseInt(limit) }
      ]);

      res.json({
        success: true,
        leaderboard
      });

    } catch (error) {
      console.error('❌ Errore leaderboard:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  }
};
