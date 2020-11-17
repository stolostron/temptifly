'use strict'

import React from 'react'
import ControlPanelCheckbox from '../../../../../src/controls/ControlPanelCheckbox'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelCheckbox component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelCheckbox
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
