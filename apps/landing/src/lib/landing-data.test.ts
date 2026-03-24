import { describe, expect, it } from 'vitest'

import { TRUSTED_RESEARCH_INSTITUTIONS } from './landing-data'

describe('TRUSTED_RESEARCH_INSTITUTIONS', () => {
  it('keeps the QS-sorted top 10 institutions stable', () => {
    expect(TRUSTED_RESEARCH_INSTITUTIONS).toHaveLength(10)
    expect(TRUSTED_RESEARCH_INSTITUTIONS.map((item) => item.name)).toEqual([
      'MIT',
      'Stanford',
      'Oxford',
      'Harvard',
      'Cambridge',
      'NUS',
      'UCL',
      'NTU Singapore',
      'Peking University',
      'UPenn',
    ])
  })
})
