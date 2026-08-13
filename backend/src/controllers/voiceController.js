const {
  EMPTY_TRANSCRIPT_ERROR,
  UNSUPPORTED_LANGUAGE_ERROR,
  VOICE_ORCHESTRATION_BOUNDARY,
  generateVoiceOrchestration,
  hasSupportedVoiceInput,
  resolveLanguage,
} = require('../services/voiceOrchestration');

async function orchestrateVoice(req, res) {
  if (!hasSupportedVoiceInput(req.body)) {
    return res.status(400).json({
      error: EMPTY_TRANSCRIPT_ERROR,
      boundary: VOICE_ORCHESTRATION_BOUNDARY,
    });
  }

  const languageResolution = resolveLanguage(req.body);

  if (languageResolution.error) {
    return res.status(400).json({
      error: UNSUPPORTED_LANGUAGE_ERROR,
      supportedLanguages: ['en', 'ar', 'vi'],
    });
  }

  const orchestration = await generateVoiceOrchestration(req.body);

  res.status(201).json(orchestration);
}

module.exports = {
  orchestrateVoice,
};
