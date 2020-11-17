'use strict'

import React from 'react'
import ControlPanelTextArea from '../../../../../src/controls/ControlPanelTextArea'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelTextArea component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelTextArea
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
