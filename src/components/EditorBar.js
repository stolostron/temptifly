'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Search } from 'carbon-components-react'
import '../scss/editor-bar.scss'
import '../../graphics/diagramIcons.svg'
import msgs from '../../nls/platform.properties'

class EditorButton extends React.Component {
  static propTypes = {
    button: PropTypes.object,
    command: PropTypes.string,
    handleClick: PropTypes.func
  };

  handleClick = () => {
    const { command, button: { disabled } } = this.props
    if (!disabled) {
      document.activeElement.blur()
      this.props.handleClick(command)
    }
  };

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.props.handleClick(this.props.command)
    }
  };

  render() {
    const { button: { disabled, tooltip, icon, spacer, command } } = this.props
    if (spacer) {
      return <div className="editor-bar-spacer" />
    } else {
      const classes = classNames({
        'editor-bar-button': true,
        [`${command}`]: true,
        disabled
      })
      return (
        <div
          className={classes}
          tabIndex={0}
          role={'button'}
          aria-label={tooltip}
          title={tooltip}
          onClick={this.handleClick}
          onKeyPress={this.handleKeyPress}
        >
          {icon ? (
            <svg>
              <use href={`#diagramIcons_${icon}`} />
            </svg>
          ) : (
            <div>{tooltip}</div>
          )}
        </div>
      )
    }
  }
}

class EditorBar extends React.Component {
  static propTypes = {
    handleEditorCommand: PropTypes.func,
    handleSearchChange: PropTypes.func,
    hasRedo: PropTypes.bool,
    hasUndo: PropTypes.bool,
    title: PropTypes.string,
    type: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      searchName: ''
    }
  }

  handleClick = command => {
    this.props.handleEditorCommand(command)
  };

  handleSearch = ({ target }) => {
    const searchName = target.value || ''
    this.props.handleSearchChange(searchName)
    this.setState({ searchName })
  };

  render() {
    const { locale } = this.context
    const { hasUndo, hasRedo, type, title } = this.props
    const { searchName } = this.state

    const undoButtons = [
      {
        command: 'undo',
        tooltip: msgs.get('editor.bar.undo', locale),
        icon: 'undo',
        disabled: !hasUndo
      },
      {
        command: 'redo',
        tooltip: msgs.get('editor.bar.redo', locale),
        icon: 'redo',
        disabled: !hasRedo
      }
    ]

    const nextButtons = [
      {
        command: 'previous',
        tooltip: msgs.get('editor.bar.previous', locale),
        icon: 'previous',
        disabled: !searchName
      },
      {
        command: 'next',
        tooltip: msgs.get('editor.bar.next', locale),
        icon: 'next',
        disabled: !searchName
      }
    ]

    const resetButtons = [
      {
        command: 'restore',
        tooltip: msgs.get('editor.bar.reset', locale),
        disabled: !hasUndo && !hasRedo
      }
    ]

    const closeButtons = [
      {
        command: 'close',
        tooltip: msgs.get('editor.bar.close', locale),
        icon: 'close'
      }
    ]

    const searchTitle = msgs.get('find.label', locale)
    return (
      <div className="editor-bar">
        <div className="editor-bar-group">
          <div className="editor-bar-title">{title}</div>
        </div>
        <div className="editor-bar-group">
          <div className="editor-bar-toolbar">
            <div className="editor-bar-section">
              {resetButtons.map(button => {
                const { command } = button
                return (
                  <EditorButton
                    key={command}
                    command={command}
                    button={button}
                    handleClick={this.handleClick}
                  />
                )
              })}
            </div>
            <div className="editor-bar-section">
              {undoButtons.map(button => {
                const { command } = button
                return (
                  <EditorButton
                    key={command}
                    command={command}
                    button={button}
                    handleClick={this.handleClick}
                  />
                )
              })}
            </div>
            <div className="editor-bar-section">
              <div
                className="editor-bar-search"
                role="region"
                aria-label={searchTitle}
                id={searchTitle}
              >
                <Search
                  id={`template-editor-search-${type}`}
                  labelText=""
                  aria-label={searchTitle}
                  placeHolderText={searchTitle}
                  small={true}
                  onChange={this.handleSearch}
                />
                {nextButtons.map(button => {
                  const { command } = button
                  return (
                    <EditorButton
                      key={command}
                      command={command}
                      button={button}
                      handleClick={this.handleClick}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="editor-bar-close">
          <div className="editor-bar-section">
            {closeButtons.map(button => {
              const { command } = button
              return (
                <EditorButton
                  key={command}
                  command={command}
                  button={button}
                  handleClick={this.handleClick}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default EditorBar
