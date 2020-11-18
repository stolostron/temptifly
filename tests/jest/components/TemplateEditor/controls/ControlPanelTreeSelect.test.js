'use strict'

import React from 'react'
import ControlPanelTreeSelect from '../../../../../src/controls/ControlPanelTreeSelect'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelTreeSelect component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelTreeSelect
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
