'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter, Link } from 'react-router-dom'

class ControlPanelPrompt extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    i18n: PropTypes.func
  };

  render() {
    const { control } = this.props
    const { id, prompts={} } = control
    const { type } = prompts
    switch (type) {
    case 'link':
      return (
        <React.Fragment key={id}>{this.renderLink(control)}</React.Fragment>
      )
    }
    return null
  }

  renderLink(control) {
    const { prompts } = control
    const { prompt, url, id } = prompts
    const { i18n } = this.props
    const text = i18n(prompt)
    return (
      <React.Fragment>
        <div className="creation-view-controls-add-value-container bottom-right">
          <BrowserRouter forceRefresh={true}>
            <Link to={url} id={id} className="creation-view-controls-add-button">
              {text}
            </Link>
          </BrowserRouter>
        </div>
      </React.Fragment>
    )
  }

}

export default ControlPanelPrompt
