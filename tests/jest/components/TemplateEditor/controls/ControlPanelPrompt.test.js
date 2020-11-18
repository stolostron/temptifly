'use strict'

import React from 'react'
import ControlPanelPrompt from '../../../../../src/controls/ControlPanelPrompt'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelPrompt component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const fetchData = {}
    const component = renderer.create(
      <ControlPanelPrompt
        key={'key'}
        control={control}
        fetchData={fetchData}
        handleAddActive={fn}
        i18n={fn}
      />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})
