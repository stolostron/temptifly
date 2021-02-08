'use strict'

import React from 'react'
import ControlPanelLabels from '../../../../../src/controls/ControlPanelLabels'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control =
{
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'labels',
}
const fn = jest.fn()

describe('ControlPanelLabels component', () => {
  it('renders as expected', () => {

    const Component = () => {
      return (
        <ControlPanelLabels
          key={'key'}
          control={control}
          controlId={'controlId'}
          handleChange={fn}
          i18n={fn}
        />
      )
    }
    const { getByTestId, asFragment, rerender, container, debug } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.type(getByTestId('labelinput'), 'label=test{enter}')
    expect(control.active).toEqual([{'key': 'label', 'value': 'test'}])
    userEvent.type(getByTestId('labelinput'), 'label=test2{enter}')
    container.querySelector('.pf-c-button').click()
    expect(control.active).toEqual([])

    debug()
    rerender()

    //    control.name = ''
    //    control.exception = 'error'
    //    rerender(<Component />)
    //    control.placeholder = 'placeholder'
    //    rerender(<Component />)
    //    expect(asFragment()).toMatchSnapshot()
  })
})
