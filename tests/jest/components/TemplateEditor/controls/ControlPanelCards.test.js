'use strict'

import React from 'react'
import ControlPanelCards from '../../../../../src/controls/ControlPanelCards'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelCards component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelCards
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
