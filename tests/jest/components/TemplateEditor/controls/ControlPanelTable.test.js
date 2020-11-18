'use strict'

import React from 'react'
import ControlPanelTable from '../../../../../src/controls/ControlPanelTable'
import renderer from 'react-test-renderer'

import { control } from '../../TestingData'

describe('ControlPanelTable component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()

    const component = renderer.create(
      <ControlPanelTable
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
