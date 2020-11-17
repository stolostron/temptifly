'use strict'

import React from 'react'
import ControlPanelNumber from '../../../../../src/controls/ControlPanelNumber'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelNumber component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelNumber
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
