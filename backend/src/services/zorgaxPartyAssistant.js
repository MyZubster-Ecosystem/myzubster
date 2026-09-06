const MAX_QUESTION_LENGTH = 400;

function cleanQuestion(value) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_QUESTION_LENGTH);
}

function normalizeQuestion(value) {
  return cleanQuestion(value).toLowerCase();
}

function unavailableAnswer(topic) {
  return {
    answer: `I don't have authorized ${topic} information in the current PartyContext.`,
    status: 'unavailable',
    grounded: true,
    sources: ['party-context']
  };
}

function restrictedAnswer() {
  return {
    answer: 'I can only use intentionally public, authorized PartyContext data. I cannot provide concealed locations, private identity data, tokens, credentials or covert logistics.',
    status: 'restricted',
    grounded: true,
    sources: ['party-context.restrictions']
  };
}

function answerFromPartyContext({ question, context }) {
  const normalized = normalizeQuestion(question);

  if (!normalized) {
    return {
      answer: 'Ask me about the current MyZubster community, room or live Party Mode session.',
      status: 'ready',
      grounded: true,
      sources: ['party-context']
    };
  }

  const restrictedTerms = [
    'hidden location',
    'secret location',
    'exact coordinates',
    'precise coordinates',
    'private address',
    'user id',
    'account id',
    'email',
    'token',
    'password',
    'private key',
    'covert logistics'
  ];

  if (restrictedTerms.some((term) => normalized.includes(term))) {
    return restrictedAnswer();
  }

  if (normalized.includes('community') || normalized.includes('who are we')) {
    return {
      answer: `${context.community.name} is the public community attached to this Party Mode context.`,
      status: 'ok',
      grounded: true,
      sources: ['party-context.community']
    };
  }

  if (
    normalized.includes('room') ||
    normalized.includes('neon plaza') ||
    normalized.includes('where am i')
  ) {
    return {
      answer: `The current room is ${context.room.name}. It is a ${context.room.kind} with ${context.room.visibility} visibility.`,
      status: 'ok',
      grounded: true,
      sources: ['party-context.room']
    };
  }

  if (
    normalized.includes('live') ||
    normalized.includes('session') ||
    normalized.includes('online') ||
    normalized.includes('participants')
  ) {
    if (!context.session) return unavailableAnswer('live-session');

    if (context.session.live) {
      const participants = Number.isInteger(context.session.participantCount)
        ? ` There are ${context.session.participantCount} active participants in the room snapshot.`
        : '';
      return {
        answer: `The requested Party Mode session is live.${participants}`,
        status: 'live',
        grounded: true,
        sources: ['party-context.session']
      };
    }

    return {
      answer: 'The supplied session is not verified as live in the current PartyContext.',
      status: context.session.state || 'unknown',
      grounded: true,
      sources: ['party-context.session']
    };
  }

  if (
    normalized.includes('event') ||
    normalized.includes('schedule') ||
    normalized.includes('artist') ||
    normalized.includes('creator') ||
    normalized.includes('lineup')
  ) {
    if (!context.event) return unavailableAnswer('event');

    return {
      answer: `The current public event is ${context.event.name || context.event.title}.`,
      status: 'ok',
      grounded: true,
      sources: ['party-context.event']
    };
  }

  if (normalized.includes('what can you do') || normalized.includes('capabilities')) {
    return {
      answer: `This Party Mode context currently allows: ${context.capabilities.join(', ')}.`,
      status: 'ok',
      grounded: true,
      sources: ['party-context.capabilities']
    };
  }

  return {
    answer: 'I can answer only from the authorized PartyContext currently available. Ask about the community, Neon Plaza, live session state, or published event information when present.',
    status: 'unsupported',
    grounded: true,
    sources: ['party-context']
  };
}

module.exports = {
  MAX_QUESTION_LENGTH,
  cleanQuestion,
  answerFromPartyContext
};
