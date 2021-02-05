'use strict'

import React from 'react'
import ControlPanelNumber from '../../../../../src/controls/ControlPanelNumber'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control =
{
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'number',
}
const fn = jest.fn()

describe('ControlPanelNumber component', () => {
  it('renders as expected', () => {

    const Component = () => {
      return (
        <ControlPanelNumber
          key={'key'}
          control={control}
          controlId={'controlId'}
          handleChange={fn}
          i18n={fn}
        />
      )
    }
    const { getByTestId, asFragment, rerender } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.type(getByTestId('numberinput'), '3')
    expect(control.active).toBe('3')
    userEvent.click(getByTestId('numberup'))
    expect(control.active).toBe('4')
    control.active = '0'
    control.exception = 'error'
    rerender(<Component />)
    expect(asFragment()).toMatchSnapshot()
    userEvent.click(getByTestId('numberdn'))
    expect(control.active).toBe('0')

  })
})
