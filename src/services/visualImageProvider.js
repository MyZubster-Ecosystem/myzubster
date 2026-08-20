const axios = require('axios');

class VisualImageProviderError extends Error {
  constructor(message, statusCode = 500, code = 'visual_image_provider_error') {
    super(message);
    this.name = 'VisualImageProviderError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function buildComicPrompt({ character, story }) {
  const panels = (story.panels || [])
    .map((panel, index) => `Panel ${index + 1}: ${panel.speaker}: ${panel.dialogue}`)
    .join('\n');

  return [
    'Create one polished four-panel comic page for MyZubster Visual.',
    `Visual style: ${character.visual?.style || 'cyberpunk comic'}.`,
    `Main guest character: ${character.display_name}, role: ${character.role}.`,
    `Character lock: ${character.visual?.traits || 'use a distinctive but non-identifying fictional design'}.`,
    'Keep the same face, hair, clothing, accessories, approximate age and body proportions for this guest character in every panel.',
    'The second recurring character is the MyZubster host: a friendly open-source technology founder with a consistent futuristic jacket and subtle MZ visual motif.',
    `Setting and intent: ${story.setting || character.collaboration?.scene_type || 'future collaboration'}; ${character.collaboration?.intent || ''}`,
    'Use clear panel borders, cinematic composition, coherent lighting and readable short speech bubbles.',
    'This is a fictional/proposal scene. Do not imply an existing endorsement, signed contract or approved commercial partnership.',
    panels,
  ].join('\n');
}

async function generateWithOpenAI({ prompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new VisualImageProviderError(
      'OPENAI_API_KEY is not configured. AI comic generation is unavailable.',
      503,
      'provider_unconfigured'
    );
  }

  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5';
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model,
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'medium',
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: Number(process.env.OPENAI_IMAGE_TIMEOUT_MS || 120000),
    }
  );

  const item = response.data?.data?.[0];
  if (!item) {
    throw new VisualImageProviderError('Image provider returned no image.', 502, 'empty_provider_response');
  }

  if (item.b64_json) {
    return {
      provider: 'openai',
      model,
      mime_type: 'image/png',
      data_url: `data:image/png;base64,${item.b64_json}`,
    };
  }

  if (item.url) {
    return {
      provider: 'openai',
      model,
      mime_type: 'image/png',
      url: item.url,
    };
  }

  throw new VisualImageProviderError('Image provider response had no supported image payload.', 502, 'unsupported_provider_response');
}

async function generateComicImage({ character, story }) {
  if (!character?.consent?.authorized_likeness) {
    throw new VisualImageProviderError(
      'Explicit likeness/character authorization is required before AI image generation.',
      400,
      'likeness_consent_required'
    );
  }

  const provider = (process.env.VISUAL_IMAGE_PROVIDER || 'openai').toLowerCase();
  const prompt = buildComicPrompt({ character, story });

  if (provider === 'openai') {
    const image = await generateWithOpenAI({ prompt });
    return { ...image, prompt };
  }

  throw new VisualImageProviderError(
    `Unsupported VISUAL_IMAGE_PROVIDER: ${provider}`,
    501,
    'unsupported_provider'
  );
}

module.exports = {
  VisualImageProviderError,
  buildComicPrompt,
  generateComicImage,
};
