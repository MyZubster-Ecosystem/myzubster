// Ambassador Model
// Defines ambassador roles, benefits, and tracking

const sqlite3 = require('sqlite3').verbose();

class Ambassador {
  constructor(db) {
    this.db = db;
  }

  // ── Initialize Database Tables ──
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Ambassadors table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ambassadors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'local',
            status TEXT NOT NULL DEFAULT 'pending',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            bio TEXT,
            location TEXT,
            social_links TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Ambassador activities
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ambassador_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ambassador_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT,
            points INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT 0,
            FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id)
          )
        `);

        // Ambassador rewards
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ambassador_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ambassador_id INTEGER NOT NULL,
            reward_type TEXT NOT NULL,
            reward_name TEXT NOT NULL,
            description TEXT,
            points_cost INTEGER NOT NULL,
            claimed_at DATETIME,
            FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id)
          )
        `);

        // Community events
        this.db.run(`
          CREATE TABLE IF NOT EXISTS community_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organizer_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT NOT NULL,
            location TEXT,
            start_time DATETIME NOT NULL,
            end_time DATETIME,
            max_participants INTEGER,
            current_participants INTEGER DEFAULT 0,
            status TEXT DEFAULT 'scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES ambassadors(id)
          )
        `);

        // Event participants
        this.db.run(`
          CREATE TABLE IF NOT EXISTS event_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'registered',
            attended BOOLEAN DEFAULT 0,
            FOREIGN KEY (event_id) REFERENCES community_events(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        this.db.run("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (err) reject(err);
          else resolve(tables);
        });
      });
    });
  }

  // ── Ambassador CRUD ──
  async createAmbassador(userId, role = 'local', bio = '', location = '') {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO ambassadors (user_id, role, bio, location) VALUES (?, ?, ?, ?)`;
      this.db.run(sql, [userId, role, bio, location], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, userId, role, status: 'pending' });
      });
    });
  }

  async getAmbassador(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT a.*, u.username, u.email,
          (SELECT COUNT(*) FROM ambassador_activities WHERE ambassador_id = a.id) as activity_count,
          (SELECT COALESCE(SUM(points), 0) FROM ambassador_activities WHERE ambassador_id = a.id) as total_points
        FROM ambassadors a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `;
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async listAmbassadors(status = null, role = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT a.*, u.username,
          (SELECT COUNT(*) FROM ambassador_activities WHERE ambassador_id = a.id) as activity_count,
          (SELECT COALESCE(SUM(points), 0) FROM ambassador_activities WHERE ambassador_id = a.id) as total_points
        FROM ambassadors a
        JOIN users u ON a.user_id = u.id
      `;
      const params = [];
      
      if (status) {
        sql += ' WHERE a.status = ?';
        params.push(status);
      }
      if (role) {
        sql += status ? ' AND a.role = ?' : ' WHERE a.role = ?';
        params.push(role);
      }
      
      sql += ' ORDER BY total_points DESC';
      
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async updateAmbassadorStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE ambassadors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      this.db.run(sql, [status, id], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes > 0 });
      });
    });
  }

  // ── Activities ──
  async logActivity(ambassadorId, type, description, points = 10) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO ambassador_activities (ambassador_id, activity_type, description, points) VALUES (?, ?, ?, ?)`;
      this.db.run(sql, [ambassadorId, type, description, points], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, points });
      });
    });
  }

  async getActivities(ambassadorId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM ambassador_activities 
        WHERE ambassador_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      this.db.all(sql, [ambassadorId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT a.id, a.role, a.location, u.username,
          COUNT(aa.id) as activities,
          COALESCE(SUM(aa.points), 0) as points
        FROM ambassadors a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN ambassador_activities aa ON a.id = aa.ambassador_id
        WHERE a.status = 'active'
        GROUP BY a.id
        ORDER BY points DESC
        LIMIT ?
      `;
      this.db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // ── Events ──
  async createEvent(organizerId, event) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO community_events 
        (organizer_id, title, description, event_type, location, start_time, end_time, max_participants)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(sql, [
        organizerId,
        event.title,
        event.description,
        event.type,
        event.location,
        event.startTime,
        event.endTime,
        event.maxParticipants || 50,
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...event });
      });
    });
  }

  async listEvents(status = 'scheduled') {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, a.role as organizer_role, u.username as organizer_name,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as registered
        FROM community_events e
        LEFT JOIN ambassadors a ON e.organizer_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE e.status = ?
        ORDER BY e.start_time ASC
      `;
      this.db.all(sql, [status], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async registerForEvent(eventId, userId) {
    return new Promise((resolve, reject) => {
      // Check capacity
      this.db.get(
        'SELECT max_participants, current_participants FROM community_events WHERE id = ?',
        [eventId],
        (err, event) => {
          if (err) return reject(err);
          if (!event) return reject(new Error('Event not found'));
          if (event.current_participants >= event.max_participants) {
            return reject(new Error('Event is full'));
          }

          // Register
          const sql = `INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)`;
          this.db.run(sql, [eventId, userId], function(err) {
            if (err) reject(err);
            else {
              // Update count
              this.db.run(
                'UPDATE community_events SET current_participants = current_participants + 1 WHERE id = ?',
                [eventId]
              );
              resolve({ registered: true, eventId, userId });
            }
          });
        }
      );
    });
  }

  // ── Rewards ──
  async getRewards() {
    return [
      { type: 'badge', name: 'Community Star', points: 100, description: 'Special badge on profile' },
      { type: 'badge', name: 'Event Master', points: 250, description: 'Organized 5+ events' },
      { type: 'badge', name: 'Ambassador Elite', points: 500, description: 'Top contributor' },
      { type: 'swag', name: 'MyZubster T-Shirt', points: 150, description: 'Official merchandise' },
      { type: 'swag', name: 'MyZubster Mug', points: 100, description: 'Branded coffee mug' },
      { type: 'access', name: 'Beta Access', points: 200, description: 'Early access to new features' },
      { type: 'access', name: 'VIP Discord', points: 75, description: 'Exclusive Discord channel' },
    ];
  }

  async claimReward(ambassadorId, rewardType, rewardName, pointsCost) {
    return new Promise((resolve, reject) => {
      // Check points
      this.db.get(
        'SELECT COALESCE(SUM(points), 0) as total FROM ambassador_activities WHERE ambassador_id = ?',
        [ambassadorId],
        (err, result) => {
          if (err) return reject(err);
          if (result.total < pointsCost) {
            return reject(new Error('Insufficient points'));
          }

          const sql = `
            INSERT INTO ambassador_rewards (ambassador_id, reward_type, reward_name, points_cost, claimed_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;
          this.db.run(sql, [ambassadorId, rewardType, rewardName, pointsCost], function(err) {
            if (err) reject(err);
            else resolve({ claimed: true, rewardName, pointsSpent: pointsCost });
          });
        }
      );
    });
  }

  // ── Statistics ──
  async getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      this.db.get('SELECT COUNT(*) as count FROM ambassadors WHERE status = "active"', (err, row) => {
        stats.activeAmbassadors = row?.count || 0;
        
        this.db.get('SELECT COUNT(*) as count FROM community_events WHERE status = "scheduled"', (err, row) => {
          stats.upcomingEvents = row?.count || 0;
          
          this.db.get('SELECT COALESCE(SUM(points), 0) as total FROM ambassador_activities', (err, row) => {
            stats.totalPointsAwarded = row?.total || 0;
            
            this.db.get('SELECT COUNT(*) as count FROM event_participants WHERE attended = 1', (err, row) => {
              stats.eventsAttended = row?.count || 0;
              resolve(stats);
            });
          });
        });
      });
    });
  }
}

module.exports = Ambassador;
