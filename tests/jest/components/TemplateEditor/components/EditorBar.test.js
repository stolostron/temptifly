'use strict'

import React from 'react'
import EditorBar from '../../../../../src/components/EditorBar'
import renderer from 'react-test-renderer'

describe('EditorBar component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const exceptions = [{ text: 'bad', row: 0 }]
    const component = renderer.create(
      <EditorBar
        hasUndo={false}
        hasRedo={true}
        exceptions={exceptions}
        gotoEditorLine={fn}
        handleEditorCommand={fn}
        handleSearchChange={fn}
        i18n={fn}
      />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})
