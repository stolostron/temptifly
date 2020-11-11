'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Tab, Tabs, Checkbox } from 'carbon-components-react'
import '../scss/editor-header.scss'
import msgs from '../../nls/platform.properties'

class EditorHeader extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    handleShowSecretChange: PropTypes.func,
    handleTabChange: PropTypes.func,
    locale: PropTypes.string,
    otherYAMLTabs: PropTypes.array,
    showSecrets: PropTypes.bool,
    type: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props)
  }

  render() {
    const { children, otherYAMLTabs = [], locale } = this.props
    const editorToolbarTitle = msgs.get('editor.toolbar', locale)
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
          aria-label={editorToolbarTitle}
          id={editorToolbarTitle}
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

  renderEditorTabs = otherYAMLTabs => {
    const { type = 'unknown', handleTabChange } = this.props
    return (
      <Tabs selected={0} aria-label={'Select template'}>
        <Tab
          label={type}
          key="main"
          id="main"
          onClick={handleTabChange.bind(this, 0)}
        />
        {otherYAMLTabs.map(({ id }, inx) => {
          return (
            <Tab
              label={id}
              key={id}
              id={id}
              onClick={handleTabChange.bind(this, inx + 1)}
            />
          )
        })}
      </Tabs>
    )
  };

  renderShowSecrets = () => {
    const { showSecrets, handleShowSecretChange, locale } = this.props
    return (
      <div className="creation-view-yaml-header-secrets">
        <Checkbox
          id="show-secrets"
          className="checkbox"
          hideLabel
          labelText=""
          checked={showSecrets}
          onChange={handleShowSecretChange}
        />
        <div>{msgs.get('editor.show.secrets', locale)}</div>
      </div>
    )
  };
}

export default EditorHeader
