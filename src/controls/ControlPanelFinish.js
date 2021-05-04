'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import capitalize from 'lodash/capitalize'

class ControlPanelFinish extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    details: PropTypes.array,
    renderNotifications: PropTypes.func,
  };

  constructor(props) {
    super(props)
  }

  render() {
    const { className, details, renderNotifications } = this.props

    return (
      <React.Fragment>
        <div className={className}>
          {renderNotifications()}
          {this.renderDetails(details)}
        </div>
      </React.Fragment>
    )
  }

  renderDetails(details) {
    let step = 1
    return (
    <div className="tf--finish-details">
      {details.map(({title, sections})=>{
        return (
          <div className="tf--finish-step">
            <div className="tf--finish-step-title" >
              <div className="tf--finish-step-circle">
                {step++}
              </div>
              <div>{title.title}</div>
            </div>
            <div className="tf--finish-step-sections">
              {this.renderSections(sections)}
            </div>
          </div>
        )
      })}
        </div>)
  }

  renderSections(sections) {
    return sections.map(({content})=>{
      return (
        <div className="pf-c-description-list__group tf--finish-step-section">
          {this.renderContent(content)}
        </div>
      )
    })
  }

  renderContent(controlData) {
    return (
      <React.Fragment>
        {controlData.map(control => {
          const { type } = control
          switch (type) {
          case 'group':
            return this.renderGroup(control)
          default:
            return this.renderControl(control)
          }
        })}
      </React.Fragment>
    )
  }

  renderGroup(control) {
    const { active = [] } = control
    return (
      <React.Fragment>
        {active.map((controlData) => {
            return this.renderContent(controlData)
        })}
      </React.Fragment>
    )
  }

  renderGroupControlSections(controlData, grpId = '') {
    // create collapsable control sections
    let section
    let content = []
    let stopRendering = false
    let stopRenderingOnNextControl = false
    const controlSections = []
    controlData.forEach(control => {
      const { type, pauseControlCreationHereUntilSelected } = control
      stopRendering = stopRenderingOnNextControl
      if (pauseControlCreationHereUntilSelected) {
        stopRenderingOnNextControl = !control.active
      }
      if (!stopRendering) {
        if (type === 'section') {
          content = []
          section = { title: control, content }
          controlSections.push(section)
        } else {
          content.push(control)
        }
      }
    })
    return this.renderControlSections(controlSections, grpId)
  }

  renderControl(control) {
    const {type, active, name, id, exception, validation} = control
    let term
    let desc
    switch(type) {
      case 'text':
      case 'singleselect':
      case 'multiselect':
      case 'combobox':
      case 'treeselect':
        term = name
        desc = active
        break
      case 'number':
        term = name
        desc = active
        break
      case 'checkbox':
        term = name
        desc = active
        break
        case 'cards':
        term = capitalize(id)
        desc = active
        break
      case 'labels':
        term = name
        desc = active.map(({ key: k, value }) => {
          return `${k}=${value}`
        }).join(', ')
    }
    if (term) {
      let styles = {}
      if (exception) {
        desc = '*Fix exceptions'
        styles = {color: "red"}
      } else if (typeof desc==='string' && desc.length>32) {
        desc = `${desc.substr(0, 16)}...${desc.substr(-16)}`
      } else if (!desc && validation && validation.required) {
        desc = '*Required'
        styles = {color: "red"}
      }
      return (
        <React.Fragment>
          <dt class="pf-c-description-list__term"><span class="pf-c-description-list__text">{term}</span></dt>
          <dd class="pf-c-description-list__description"><div class="pf-c-description-list__text" style={styles}>{desc}</div></dd>
        </React.Fragment>
      )
    } else {
      return null
    }
  }

}

export default ControlPanelFinish
