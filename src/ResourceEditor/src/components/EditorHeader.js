'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Checkbox } from '@patternfly/react-core'
import '../css/editor-header.scss'
import { defaultResourceEditorOptions } from '../ResourceEditor'

class EditorHeader extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    handleShowSecretChange: PropTypes.func,
    handleTabChange: PropTypes.func,
    otherYAMLTabs: PropTypes.array,
    showSecrets: PropTypes.bool,
    type: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props)
  }

  render() {
    const { children, otherYAMLTabs = [] } = this.props
    const hasTabs = otherYAMLTabs.length > 0
    const classnames = classNames({
      'creation-view-yaml-header': true,
      hasTabs: hasTabs
    })
    return (
      <div className={classnames}>
        <div
          className="creation-view-yaml-header-toolbar"
          role="region"
          id='editor-toolbar-title'
        >
          {children}
        </div>
        {hasTabs && (
          <div className="creation-view-yaml-header-tabs">
            {this.renderEditorTabs(otherYAMLTabs)}
            {this.renderShowSecrets()}
          </div>
        )}
      </div>
    )
  }

  setTabsRef = ref => {
    this.tabsRef = ref
  };

  renderEditorTabs = otherYAMLTabs => {
    const { type = 'unknown', handleTabChange } = this.props

    const onClick = (e, tab) => {
      Array.from(this.tabsRef.children)
        .forEach((child, inx)=>child.classList.toggle('tf--tabs__nav-item--selected', inx===tab))
      handleTabChange(tab)
    }
    return (
      <nav aria-label="Select template" className="tf--tabs" role="navigation">
        <ul role="tablist" className="tf--tabs__nav" ref={this.setTabsRef}>
          <li id="main" role="presentation" tabIndex="-1"
            className="tf--tabs__nav-item tf--tabs__nav-item--selected"
            onClick={(e)=>onClick(e, 0)}>
            <a className="tf--tabs__nav-link"
              role="tab" tabIndex="0" aria-selected="true">
              {type}
            </a>
          </li>
          {otherYAMLTabs.map(({ id }, inx) => {
            return (
              <li id={id} key={id} role="presentation" tabIndex="-1" className="tf--tabs__nav-item"
                onClick={(e)=>onClick(e, inx+1)}>
                <a className="tf--tabs__nav-link"
                  role="tab" tabIndex="0" aria-selected="false">
                  {id}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  };

  renderShowSecrets = () => {
    const { showSecrets, handleShowSecretChange } = this.props
    return (
      <div className="creation-view-yaml-header-secrets">
        <Checkbox
          aria-label="show-secrets"
          id="show-secrets"
          isChecked={showSecrets}
          onChange={handleShowSecretChange}
        />
        <div>{defaultResourceEditorOptions.showSecrets}</div>
      </div>
    )
  };
}

export default EditorHeader
