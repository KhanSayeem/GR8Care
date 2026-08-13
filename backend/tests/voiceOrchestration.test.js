const request = require('supertest');
const {
  SUPPORTED_LANGUAGES,
  VOICE_ORCHESTRATION_BOUNDARY,
  detectLanguageCode,
  generateVoiceOrchestration,
} = require('../src/services/voiceOrchestration');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gr8care-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

describe('voice-to-voice orchestration backend', () => {
  it('supports English, Arabic, and Vietnamese language metadata', () => {
    expect(Object.keys(SUPPORTED_LANGUAGES).sort()).toEqual(['ar', 'en', 'vi']);
    expect(SUPPORTED_LANGUAGES.ar).toEqual(
      expect.objectContaining({
        locale: 'ar',
        direction: 'rtl',
      })
    );
    expect(SUPPORTED_LANGUAGES.vi.locale).toBe('vi-VN');
  });

  it('detects supported languages from supplied transcripts', () => {
    expect(detectLanguageCode('Can you help me book a support worker?')).toBe('en');
    expect(detectLanguageCode('هل يمكنك مساعدتي في الدعم؟')).toBe('ar');
    expect(detectLanguageCode('Tôi cần hỗ trợ cho kế hoạch NDIS')).toBe('vi');
  });

  it('returns same-language Arabic response metadata for Arabic speech', async () => {
    const res = await request(app)
      .post('/voice/orchestrate')
      .send({ transcript: 'هل يمكنك مساعدتي في شرح خطة الدعم؟', confidence: 0.91 });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('voiceToVoiceOrchestration');
    expect(res.body.boundary).toBe(VOICE_ORCHESTRATION_BOUNDARY);
    expect(res.body.language.detected.code).toBe('ar');
    expect(res.body.language.response.code).toBe('ar');
    expect(res.body.tts).toEqual(
      expect.objectContaining({
        languageCode: 'ar',
        locale: 'ar',
        direction: 'rtl',
      })
    );
    expect(res.body.ai.responseText).toContain('سمعت');
    expect(res.body.translation.required).toBe(true);
    expect(res.body.speechRecognition.confidence).toBe(0.91);
  });

  it('uses selected Vietnamese language when detection is not enough', async () => {
    const res = await request(app)
      .post('/voice/orchestrate')
      .send({ speechText: 'I need support for my plan', selectedLanguage: 'vi' });

    expect(res.status).toBe(201);
    expect(res.body.language.detected.code).toBe('en');
    expect(res.body.language.selected.code).toBe('vi');
    expect(res.body.language.selectedLanguageOverride).toBe(true);
    expect(res.body.language.response.code).toBe('vi');
    expect(res.body.tts.locale).toBe('vi-VN');
    expect(res.body.ai.responseText).toContain('Tôi đã nghe');
  });

  it('supports future provider injection without hard-wiring a speech vendor', async () => {
    const aiClient = {
      generateCareResponse: jest.fn().mockResolvedValue('English draft response'),
      translateResponse: jest.fn().mockResolvedValue('Phản hồi tiếng Việt'),
    };

    const result = await generateVoiceOrchestration(
      { text: 'Xin chào, tôi cần hỗ trợ', languageCode: 'vi' },
      aiClient
    );

    expect(aiClient.generateCareResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        transcript: 'Xin chào, tôi cần hỗ trợ',
        languageCode: 'vi',
      })
    );
    expect(aiClient.translateResponse).toHaveBeenCalledWith({
      text: 'English draft response',
      fromLanguageCode: 'en',
      toLanguageCode: 'vi',
    });
    expect(result.ai.provider).toBe('injected');
    expect(result.tts.text).toBe('Phản hồi tiếng Việt');
  });

  it('rejects empty voice orchestration requests', async () => {
    const res = await request(app).post('/voice/orchestrate').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('transcript, speechText, audioTranscript, or text is required');
    expect(res.body.boundary).toContain('Voice-to-voice support assistant only');
  });

  it('rejects unsupported selected languages', async () => {
    const res = await request(app)
      .post('/voice/orchestrate')
      .send({ transcript: 'Necesito ayuda', selectedLanguage: 'es' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('selectedLanguage must be one of: en, ar, vi');
    expect(res.body.supportedLanguages).toEqual(['en', 'ar', 'vi']);
  });
});
