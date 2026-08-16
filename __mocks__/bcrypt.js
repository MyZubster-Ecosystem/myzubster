// Mock bcrypt for tests (avoids native binding requirement)
module.exports = {
  hash: async (data, salt) => `hashed_${data}`,
  compare: async (data, hash) => hash === `hashed_${data}`,
  hashSync: (data, salt) => `hashed_${data}`,
  compareSync: (data, hash) => hash === `hashed_${data}`,
  genSalt: async (rounds) => 'salt',
  genSaltSync: (rounds) => 'salt'
};
