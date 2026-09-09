jest.mock('../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../services/gmailProfileSync', () => ({
  encryptSecret: jest.fn(),
  deriveProfile: jest.fn(),
  sampleGmail: jest.fn(),
  syncUser: jest.fn()
}));

const User = require('../models/User');
const emailProfileController = require('./emailProfileController');

function responseDouble() {
  const res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function queryReturning(value, error = null) {
  const query = {
    select: jest.fn(),
    maxTimeMS: jest.fn(),
    exec: jest.fn()
  };
  query.select.mockReturnValue(query);
  query.maxTimeMS.mockReturnValue(query);
  if (error) query.exec.mockRejectedValue(error);
  else query.exec.mockResolvedValue(value);
  return query;
}

describe('emailProfileController.autoSyncStatus', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns 503 when MongoDB cannot serve the status query', async () => {
    const query = queryReturning(null, new Error('buffering timed out'));
    User.findById.mockReturnValue(query);
    const res = responseDouble();

    await emailProfileController.autoSyncStatus({ userId: 'user-1' }, res);

    expect(query.maxTimeMS).toHaveBeenCalledWith(8000);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database temporaneamente non disponibile'
    });
  });

  test('returns a safe disabled status without exposing stored secrets', async () => {
    const user = {
      gmailProfileSync: null,
      zorgaxProfile: null
    };
    User.findById.mockReturnValue(queryReturning(user));
    const res = responseDouble();

    await emailProfileController.autoSyncStatus({ userId: 'user-1' }, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        sync: { enabled: false },
        profile: null
      }
    });
  });
});
