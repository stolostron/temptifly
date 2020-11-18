'use strict'

import React from 'react'
import ControlPanelComboBox from '../../../../../src/controls/ControlPanelComboBox'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelComboBox component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelComboBox
        key={'key'}
        control={control}
        controlId={'controlId'}
        handleChange={fn}
        i18n={fn}
      />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})
