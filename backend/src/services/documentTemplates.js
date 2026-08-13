const DOCUMENT_TEMPLATE_BOUNDARY =
  'Template export is a drafting aid only. It is not legal advice, not clinical advice, not funding approval, not an audit certification, and not an official NDIA document.';

const MISSING_VALUE = 'Not supplied';

const documentTemplates = [
  {
    id: 'participant-service-update',
    title: 'Participant service update',
    category: 'Participant communication',
    description: 'Plain-language update for families, participants, or coordinators after a support change.',
    version: '1.0',
    defaultBody:
      'Use this template to explain what changed, what happens next, and who to contact for official decisions.',
    fields: [
      {
        key: 'participantName',
        label: 'Participant name',
        required: true,
        placeholder: 'Amina Rahman',
      },
      {
        key: 'supportChange',
        label: 'Support change',
        required: true,
        placeholder: 'Transport support moved to Friday afternoon',
      },
      {
        key: 'nextStep',
        label: 'Next step',
        required: true,
        placeholder: 'Coordinator to confirm the updated booking',
      },
      {
        key: 'contactName',
        label: 'Contact name',
        required: false,
        placeholder: 'Service coordinator',
      },
    ],
  },
  {
    id: 'shift-note-summary',
    title: 'Shift note summary',
    category: 'Worker documentation',
    description: 'Structured support-worker note with uncertainty preserved for missing details.',
    version: '1.0',
    defaultBody:
      'Use only worker-supplied observations. Missing details should remain marked as not supplied.',
    fields: [
      { key: 'date', label: 'Date', required: true, placeholder: '2026-08-13' },
      { key: 'activities', label: 'Activities', required: true, placeholder: 'Community access' },
      {
        key: 'participantEngagement',
        label: 'Participant engagement',
        required: false,
        placeholder: 'Participant chose the route',
      },
      { key: 'outcome', label: 'Outcome', required: false, placeholder: 'Goal practised' },
    ],
  },
  {
    id: 'provider-intake-checklist',
    title: 'Provider intake checklist',
    category: 'Provider operations',
    description: 'Provider-side checklist for recording intake context before service matching.',
    version: '1.0',
    defaultBody:
      'Use this template to keep intake context consistent before matching or booking conversations.',
    fields: [
      { key: 'providerName', label: 'Provider name', required: true, placeholder: 'GR8Care Partner' },
      { key: 'serviceNeed', label: 'Service need', required: true, placeholder: 'Personal care' },
      { key: 'availability', label: 'Availability', required: false, placeholder: 'Weekday afternoons' },
      { key: 'riskNotes', label: 'Risk notes', required: false, placeholder: 'Follow provider policy' },
    ],
  },
];

function normalizeValue(value) {
  const normalized = String(value || '').trim();
  return normalized.length > 0 ? normalized : MISSING_VALUE;
}

function listDocumentTemplates({ category } = {}) {
  return documentTemplates
    .filter((template) => !category || template.category === category)
    .map((template) => ({
      ...template,
      boundary: DOCUMENT_TEMPLATE_BOUNDARY,
    }));
}

function getDocumentTemplateById(id) {
  return listDocumentTemplates().find((template) => template.id === id) || null;
}

function findMissingRequiredFields(template, values = {}) {
  return template.fields
    .filter((field) => field.required && normalizeValue(values[field.key]) === MISSING_VALUE)
    .map((field) => field.key);
}

function fillDocumentTemplate(id, values = {}) {
  const template = getDocumentTemplateById(id);

  if (!template) {
    return null;
  }

  const fields = template.fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    value: normalizeValue(values[field.key]),
  }));

  return {
    mode: 'documentTemplateFill',
    boundary: DOCUMENT_TEMPLATE_BOUNDARY,
    template: {
      id: template.id,
      title: template.title,
      category: template.category,
      version: template.version,
      defaultBody: template.defaultBody,
    },
    missingRequiredFields: findMissingRequiredFields(template, values),
    fields,
  };
}

function escapePdfText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapPdfLine(text, maxLength = 88) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [MISSING_VALUE];
}

function buildPdfContentLines(filledTemplate) {
  const lines = [
    'GR8Care Document Template Export',
    filledTemplate.template.title,
    filledTemplate.template.category,
    DOCUMENT_TEMPLATE_BOUNDARY,
    filledTemplate.template.defaultBody,
  ];

  filledTemplate.fields.forEach((field) => {
    lines.push(`${field.label}: ${field.value}`);
  });

  if (filledTemplate.missingRequiredFields.length > 0) {
    lines.push(`Missing required fields: ${filledTemplate.missingRequiredFields.join(', ')}`);
  }

  return lines.flatMap((line) => wrapPdfLine(line));
}

function buildPdfStream(lines) {
  const renderedLines = lines.map((line, index) => {
    const y = 760 - index * 18;
    return `BT /F1 11 Tf 48 ${Math.max(y, 48)} Td (${escapePdfText(line)}) Tj ET`;
  });

  return renderedLines.join('\n');
}

function createPdfBuffer(lines) {
  const stream = buildPdfStream(lines);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

function exportFilledTemplatePdf(id, values = {}) {
  const filledTemplate = fillDocumentTemplate(id, values);

  if (!filledTemplate) {
    return null;
  }

  return {
    filename: `${id}.pdf`,
    filledTemplate,
    pdf: createPdfBuffer(buildPdfContentLines(filledTemplate)),
  };
}

module.exports = {
  DOCUMENT_TEMPLATE_BOUNDARY,
  MISSING_VALUE,
  buildPdfContentLines,
  exportFilledTemplatePdf,
  fillDocumentTemplate,
  getDocumentTemplateById,
  listDocumentTemplates,
};
