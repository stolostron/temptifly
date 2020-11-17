'use strict'

import React from 'react'
import EditorHeader from '../../../../../src/components/EditorHeader'
import renderer from 'react-test-renderer'

const type = 'application'
const otherYAMLTabs = []
const handleTabChange = jest.fn

describe('EditorHeader component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <EditorHeader
        otherYAMLTabs={otherYAMLTabs}
        handleTabChange={handleTabChange}
        type={type}
        i18n={fn}
      />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})
