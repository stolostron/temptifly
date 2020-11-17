'use strict'

import React from 'react'
import ControlPanel from '../../../../../src/controls/ControlPanel'
import renderer from 'react-test-renderer'

import { controlData } from '../../TestingData'

// mock the Math.random() value
const mockMath = Object.create(global.Math)
mockMath.random = () => 0.5
global.Math = mockMath

describe('ControlPanel component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanel
        controlData={controlData}
        notifications={[]}
        showEditor={true}
        i18n={fn}
      />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })
})
