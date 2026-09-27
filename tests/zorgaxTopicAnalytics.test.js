const { classifyTopic, recordTopic } = require('../src/services/zorgaxTopicAnalyticsService');

describe('Zorgax topic analytics', () => {
  test('classifies project requests conservatively, leaving unknown requests unclassified', () => {
    expect(classifyTopic('Voglio documentare un progetto di economia circolare')).toBe('circular_project');
    expect(classifyTopic('Come costruire un progetto nuovo?')).toBe('project');
    expect(classifyTopic('Ciao Zorgax')).toBe('other');
  });

  test('persists only day, topic and count, without message text or identifiers', async () => {
    const TopicModel = { findOneAndUpdate: jest.fn().mockResolvedValue({}) };
    const message = 'Voglio creare un progetto circolare con dati privati';
    await recordTopic({ message, now: new Date('2026-09-27T12:00:00Z'), TopicModel });

    expect(TopicModel.findOneAndUpdate).toHaveBeenCalledWith(
      { day: '2026-09-27', topic: 'circular_project' },
      { $inc: { count: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    expect(JSON.stringify(TopicModel.findOneAndUpdate.mock.calls)).not.toContain(message);
  });
});
