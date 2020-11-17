'use strict'

import React from 'react'
import ControlPanelSkeleton from '../../../../../src/controls/ControlPanelSkeleton'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelSkeleton component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()
    const component = renderer.create(
      <ControlPanelSkeleton
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
