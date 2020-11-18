'use strict'

import React from 'react'
import ControlPanelMultiSelect from '../../../../../src/controls/ControlPanelMultiSelect'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelMultiSelect component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelMultiSelect
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
