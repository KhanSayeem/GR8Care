const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    locale: 'en-AU',
    direction: 'ltr',
    voiceHint: 'supportive-english',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    locale: 'ar',
    direction: 'rtl',
    voiceHint: 'supportive-arabic',
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    locale: 'vi-VN',
    direction: 'ltr',
    voiceHint: 'supportive-vietnamese',
  },
};

const VOICE_ORCHESTRATION_BOUNDARY = [
  'Voice-to-voice support assistant only.',
  'Do not treat responses as emergency support, legal advice, clinical advice, funding approval, or an official NDIA decision.',
  'Keep the response in the same supported language as the participant or selected language.',
].join(' ');

const EMPTY_TRANSCRIPT_ERROR = 'transcript, speechText, audioTranscript, or text is required';
const UNSUPPORTED_LANGUAGE_ERROR = 'selectedLanguage must be one of: en, ar, vi';

const LANGUAGE_ALIASES = {
  english: 'en',
  'en-au': 'en',
  'en-us': 'en',
  arabic: 'ar',
  'ar-ae': 'ar',
  'ar-sa': 'ar',
  vietnamese: 'vi',
  'vi-vn': 'vi',
};

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeLanguageCode(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return '';
  }

  return LANGUAGE_ALIASES[normalized] || normalized.split('-')[0];
}

function isSupportedLanguage(code) {
  return Boolean(SUPPORTED_LANGUAGES[code]);
}

function resolveTranscript(input = {}) {
  return normalizeText(input.transcript ?? input.speechText ?? input.audioTranscript ?? input.text);
}

function detectLanguageCode(transcript = '') {
  const text = normalizeText(transcript).toLowerCase();

  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }

  if (/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)) {
    return 'vi';
  }

  if (/\b(xin chao|xin chào|cam on|cảm ơn|ho tro|hỗ trợ|toi can|tôi cần)\b/.test(text)) {
    return 'vi';
  }

  return 'en';
}

function resolveLanguage(input = {}) {
  const selectedLanguageCode = normalizeLanguageCode(
    input.selectedLanguage ?? input.languageCode ?? input.language
  );

  if (selectedLanguageCode && !isSupportedLanguage(selectedLanguageCode)) {
    return {
      error: UNSUPPORTED_LANGUAGE_ERROR,
      selectedLanguageCode,
    };
  }

  const transcript = resolveTranscript(input);
  const detectedLanguageCode = detectLanguageCode(transcript);
  const sourceLanguageCode = selectedLanguageCode || detectedLanguageCode;

  return {
    detectedLanguageCode,
    sourceLanguageCode,
    selectedLanguageCode: selectedLanguageCode || null,
  };
}

function buildVoiceMessages({ transcript, languageCode }) {
  const language = SUPPORTED_LANGUAGES[languageCode];

  return [
    { role: 'system', content: VOICE_ORCHESTRATION_BOUNDARY },
    {
      role: 'user',
      content: [
        `Participant language: ${language.name} (${language.code})`,
        `Transcript: ${transcript}`,
        'Return a concise, supportive care-navigation response in the same language.',
      ].join('\n'),
    },
  ];
}

function buildEnglishCareResponse(transcript) {
  return [
    `I heard: "${transcript}".`,
    'I can help you turn this into a clear support request, explain the next step, or prepare notes for your care team.',
    'For urgent safety, clinical, legal, funding, or plan-decision questions, use the appropriate official support channel.',
  ].join(' ');
}

function localizeResponse(englishResponse, languageCode) {
  if (languageCode === 'ar') {
    return [
      'سمعت طلبك.',
      'يمكنني مساعدتك في تحويله إلى طلب دعم واضح، أو شرح الخطوة التالية، أو إعداد ملاحظات لفريق الرعاية.',
      'للحالات العاجلة أو الأسئلة الطبية أو القانونية أو قرارات التمويل والخطة، استخدم القنوات الرسمية المناسبة.',
    ].join(' ');
  }

  if (languageCode === 'vi') {
    return [
      'Tôi đã nghe yêu cầu của bạn.',
      'Tôi có thể giúp chuyển nội dung này thành yêu cầu hỗ trợ rõ ràng, giải thích bước tiếp theo, hoặc chuẩn bị ghi chú cho nhóm chăm sóc.',
      'Với tình huống khẩn cấp, y tế, pháp lý, phê duyệt tài trợ, hoặc quyết định về kế hoạch, hãy dùng kênh hỗ trợ chính thức phù hợp.',
    ].join(' ');
  }

  return englishResponse;
}

function buildTtsMetadata(responseText, languageCode) {
  const language = SUPPORTED_LANGUAGES[languageCode];

  return {
    text: responseText,
    languageCode: language.code,
    locale: language.locale,
    direction: language.direction,
    voiceHint: language.voiceHint,
    format: 'text/plain',
  };
}

async function generateVoiceOrchestration(input = {}, aiClient = null) {
  const transcript = resolveTranscript(input);
  const languageResolution = resolveLanguage(input);

  if (!transcript) {
    return {
      error: EMPTY_TRANSCRIPT_ERROR,
    };
  }

  if (languageResolution.error) {
    return languageResolution;
  }

  const { detectedLanguageCode, sourceLanguageCode, selectedLanguageCode } = languageResolution;
  const messages = buildVoiceMessages({ transcript, languageCode: sourceLanguageCode });
  const englishResponse =
    aiClient && typeof aiClient.generateCareResponse === 'function'
      ? await aiClient.generateCareResponse({ messages, transcript, languageCode: sourceLanguageCode })
      : buildEnglishCareResponse(transcript);

  const responseText =
    sourceLanguageCode === 'en'
      ? englishResponse
      : aiClient && typeof aiClient.translateResponse === 'function'
        ? await aiClient.translateResponse({
            text: englishResponse,
            fromLanguageCode: 'en',
            toLanguageCode: sourceLanguageCode,
          })
        : localizeResponse(englishResponse, sourceLanguageCode);

  return {
    mode: 'voiceToVoiceOrchestration',
    boundary: VOICE_ORCHESTRATION_BOUNDARY,
    transcript,
    language: {
      detected: SUPPORTED_LANGUAGES[detectedLanguageCode],
      selected: selectedLanguageCode ? SUPPORTED_LANGUAGES[selectedLanguageCode] : null,
      response: SUPPORTED_LANGUAGES[sourceLanguageCode],
      selectedLanguageOverride: Boolean(
        selectedLanguageCode && selectedLanguageCode !== detectedLanguageCode
      ),
    },
    speechRecognition: {
      source: 'providedTranscript',
      confidence: input.confidence ?? null,
    },
    ai: {
      messages,
      responseText,
      provider: aiClient ? 'injected' : 'deterministic-mvp',
    },
    translation: {
      sourceLanguageCode: 'en',
      targetLanguageCode: sourceLanguageCode,
      required: sourceLanguageCode !== 'en',
      provider: aiClient && sourceLanguageCode !== 'en' ? 'injected' : 'deterministic-mvp',
    },
    tts: buildTtsMetadata(responseText, sourceLanguageCode),
  };
}

function hasSupportedVoiceInput(input = {}) {
  return resolveTranscript(input).length > 0;
}

module.exports = {
  EMPTY_TRANSCRIPT_ERROR,
  SUPPORTED_LANGUAGES,
  UNSUPPORTED_LANGUAGE_ERROR,
  VOICE_ORCHESTRATION_BOUNDARY,
  buildTtsMetadata,
  buildVoiceMessages,
  detectLanguageCode,
  generateVoiceOrchestration,
  hasSupportedVoiceInput,
  isSupportedLanguage,
  normalizeLanguageCode,
  resolveLanguage,
  resolveTranscript,
};
