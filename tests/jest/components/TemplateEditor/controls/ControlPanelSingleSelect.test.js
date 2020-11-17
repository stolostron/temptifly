'use strict'

import React from 'react'
import ControlPanelSingleSelect from '../../../../../src/controls/ControlPanelSingleSelect'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelSingleSelect component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelSingleSelect
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
