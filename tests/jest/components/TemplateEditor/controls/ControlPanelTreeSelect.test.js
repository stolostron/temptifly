'use strict'

import React from 'react'
import ControlPanelTreeSelect from '../../../../../src/controls/ControlPanelTreeSelect'
import renderer from 'react-test-renderer'


export const control =
{
  active: false,
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'checkbox',
  type: 'checkbox',
}

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
