'use strict'

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import TemplateEditor from '../../../../src/TemplateEditor'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import template from '../../../../example/templates/template.hbs'
import controlData from '../../../../example/controlData/ControlData'

//window.MonacoEnvironment = {
//  getWorkerUrl: function() {
//    return `${config.contextPath}/editor.worker.js`
//  }
//}

export const portals = Object.freeze({
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
  editBtn: 'edit-button-portal-id'
})

const i18n = (key) => {
  return key
}

describe('TemplateEditor component',() => {
  it('renders as expected',  async () => {

    jest.setTimeout(30000)

    window.scrollBy = () => {}
    const createResource = (json) => {
      expect(json).toMatchSnapshot()
    }
    const createControl={
      createResource,
    }
    const Component = () => {
      return (
        <BrowserRouter>
          <div id={portals.createBtn} />
          <TemplateEditor
            template={template}
            controlData={controlData}
            createControl={createControl}
            portals={portals}
            type={'application'}
            title={'creation.app.yaml'}
            i18n={i18n}
            initialOpen={true}
          />
        </BrowserRouter>
      )
    }
    const { getByTestId, asFragment, getByRole, getByText, container } = render(<Component />)

    // text
    userEvent.type(getByTestId('text-eman'), 'test')
    // card
    userEvent.click(getByTestId('card-cluster.create.baremetal.subtitle'))

    // combobox
    await waitFor(() => expect(screen.getByTestId('combo-imageSet')).toBeInTheDocument())
    userEvent.type(getByTestId('combo-imageSet'), '4.3.40-x86_64')
    // tree select
    userEvent.type(getByTestId('tree-workerType'), 'highmem-16')
    // table
    userEvent.click(container.querySelector('[name="check-all"]'))
    userEvent.click(getByRole('button', { name: /edit row 1/i }))
    userEvent.click(getByRole('button', { name: /save edits for row 1/i }))
    userEvent.click(getByRole('button', { name: /edit row 2/i }))
    userEvent.click(getByRole('button', { name: /cancel edits for row 2/i }))
    userEvent.click(getByText('creation.ocp.host.name'))
    userEvent.click(getByText('creation.ocp.host.name'))
    userEvent.type(getByRole('textbox', { name: /search input/i }), 'bma1')
    expect(asFragment()).toMatchSnapshot()

    // create json
    userEvent.click(getByTestId('create-button-portal-id'))
  })
})
