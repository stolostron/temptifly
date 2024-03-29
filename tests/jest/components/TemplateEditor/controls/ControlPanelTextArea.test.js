'use strict'

import React from 'react'
import ControlPanelTextArea from '../../../../../src/controls/ControlPanelTextArea'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control =
{
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'text',
}
const fn = jest.fn()

describe('ControlPanelTextArea component', () => {
  it('renders as expected', () => {

    const Component = () => {
      return (
        <ControlPanelTextArea
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

    userEvent.type(getByTestId('area-controlId'), 'n')
    expect(control.active[0]).toBe('n')

    control.name = ''
    control.exception = 'error'
    rerender(<Component />)
    control.placeholder = 'placeholder'
    rerender(<Component />)
    expect(asFragment()).toMatchSnapshot()
  })
})
