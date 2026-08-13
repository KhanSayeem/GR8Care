const request = require('supertest');
const { DOCUMENT_TEMPLATE_CATEGORIES } = require('../src/models/DocumentTemplate');
const {
  DOCUMENT_TEMPLATE_BOUNDARY,
  exportFilledTemplatePdf,
  fillDocumentTemplate,
  listDocumentTemplates,
} = require('../src/services/documentTemplates');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gr8care-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

describe('document templates backend', () => {
  it('defines the MVP template data model categories', () => {
    expect(DOCUMENT_TEMPLATE_CATEGORIES).toEqual([
      'Participant communication',
      'Worker documentation',
      'Provider operations',
    ]);
  });

  it('lists seeded document templates with the drafting boundary', () => {
    const templates = listDocumentTemplates();

    expect(templates).toHaveLength(3);
    expect(templates[0]).toEqual(
      expect.objectContaining({
        id: 'participant-service-update',
        boundary: DOCUMENT_TEMPLATE_BOUNDARY,
      })
    );
    expect(templates[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'participantName', required: true }),
      ])
    );
    expect(DOCUMENT_TEMPLATE_BOUNDARY).toContain('not legal advice');
    expect(DOCUMENT_TEMPLATE_BOUNDARY).toContain('not an official NDIA document');
  });

  it('fills templates and preserves missing required fields', () => {
    const filledTemplate = fillDocumentTemplate('participant-service-update', {
      participantName: 'Amina Rahman',
      supportChange: 'Transport support moved to Friday afternoon',
    });

    expect(filledTemplate.missingRequiredFields).toEqual(['nextStep']);
    expect(filledTemplate.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'participantName', value: 'Amina Rahman' }),
        expect.objectContaining({ key: 'nextStep', value: 'Not supplied' }),
      ])
    );
  });

  it('creates a PDF buffer for a filled-in template without a provider dependency', () => {
    const exportResult = exportFilledTemplatePdf('provider-intake-checklist', {
      providerName: 'GR8Care Partner',
      serviceNeed: 'Personal care',
    });
    const pdfText = exportResult.pdf.toString('utf8');

    expect(exportResult.filename).toBe('provider-intake-checklist.pdf');
    expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfText).toContain('GR8Care Document Template Export');
    expect(pdfText).toContain('Provider name: GR8Care Partner');
    expect(pdfText).toContain('Service need: Personal care');
  });

  it('exposes list, fill, and PDF export endpoints', async () => {
    const listRes = await request(app).get('/document-templates');
    const fillRes = await request(app)
      .post('/document-templates/shift-note-summary/fill')
      .send({
        values: {
          date: '2026-08-13',
          activities: 'Community access',
          outcome: 'Goal practised',
        },
      });
    const pdfRes = await request(app)
      .post('/document-templates/shift-note-summary/export.pdf')
      .send({
        values: {
          date: '2026-08-13',
          activities: 'Community access',
        },
      });

    expect(listRes.status).toBe(200);
    expect(listRes.body.templates[0]).toEqual(
      expect.objectContaining({
        id: 'participant-service-update',
      })
    );

    expect(fillRes.status).toBe(201);
    expect(fillRes.body.mode).toBe('documentTemplateFill');
    expect(fillRes.body.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'activities', value: 'Community access' }),
      ])
    );

    expect(pdfRes.status).toBe(201);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain('shift-note-summary.pdf');
    expect(pdfRes.body.toString('utf8').startsWith('%PDF-1.4')).toBe(true);
  });

  it('rejects unknown categories and missing templates', async () => {
    const categoryRes = await request(app).get('/document-templates?category=Unknown');
    const detailRes = await request(app).get('/document-templates/missing');
    const fillRes = await request(app).post('/document-templates/missing/fill').send({ values: {} });

    expect(categoryRes.status).toBe(400);
    expect(categoryRes.body.categories).toEqual(DOCUMENT_TEMPLATE_CATEGORIES);
    expect(detailRes.status).toBe(404);
    expect(fillRes.status).toBe(404);
  });
});
