const { EDUCATION_CATEGORIES } = require('../src/models/EducationContent');
const {
  EDUCATION_BOUNDARY,
  getContentById,
  listCategories,
  listContent,
} = require('../src/services/educationContent');

describe('education content API data', () => {
  it('exposes the required MVP education categories', () => {
    expect(EDUCATION_CATEGORIES).toEqual([
      'NDIS Basics',
      'Funding Education',
      'Support Education',
      'Provider Education',
    ]);
    expect(listCategories().map((item) => item.category)).toEqual(EDUCATION_CATEGORIES);
  });

  it('returns educational-only boundaries with content', () => {
    const content = listContent({ category: 'Funding Education' });

    expect(content).toHaveLength(1);
    expect(content[0]).toEqual(
      expect.objectContaining({
        category: 'Funding Education',
        boundary: EDUCATION_BOUNDARY,
      })
    );
    expect(content[0].boundary).toContain('not official NDIA advice');
    expect(content[0].boundary).toContain('not legal advice');
    expect(content[0].boundary).toContain('funding approval');
  });

  it('finds content details by id', () => {
    expect(getContentById('whodas-overview')).toEqual(
      expect.objectContaining({
        title: 'WHODAS overview',
        category: 'Support Education',
        boundary: EDUCATION_BOUNDARY,
      })
    );
    expect(getContentById('missing')).toBeNull();
  });
});
