'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  Icon,
  ComboBox,
  MultiSelect,
  Notification,
  DropdownSkeleton,
  InlineLoading
} from 'carbon-components-react'
import _ from 'lodash'
import {
  AddIcon,
} from '../icons/Icons'

class ControlPanelPrompt extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleAddActive: PropTypes.func,
    i18n: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      activeItemsSet: false
    }
  }

  componentDidUpdate() {
    const { control, handleAddActive, fetchData } = this.props
    const { fetchAvailable, isLoading } = control
    const hasActiveFetch = fetchAvailable && fetchAvailable.setActive

    if (!this.state.activeItemsSet) {
      if (!hasActiveFetch) {
        //eslint-disable-next-line react/no-did-update-set-state
        this.setState({ activeItemsSet: true })
      } else if (!isLoading) {
        fetchAvailable.setActive(control, fetchData)
        handleAddActive(control.active)
        //eslint-disable-next-line react/no-did-update-set-state
        this.setState({ activeItemsSet: true })
      }
    }
  }

  render() {
    const { control } = this.props
    const { id, prompts={} } = control
    const { type } = prompts
    switch (type) {
    case 'link':
      return (
        <React.Fragment key={id}>{this.renderLink(control)}</React.Fragment>
      )
    case 'button':
      return (
        <React.Fragment key={id}>{this.renderButton(control)}</React.Fragment>
      )
    case 'combobox':
      return (
        <React.Fragment key={id}>
          {this.renderCombobox(control)}
        </React.Fragment>
      )
    case 'multiselect':
      return (
        <React.Fragment key={id}>
          {this.renderMultiSelect(control)}
        </React.Fragment>
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
          <Link to={url} id={id} className="creation-view-controls-add-button">
            {text}
          </Link>
        </div>
      </React.Fragment>
    )
  }

  renderButton(control) {
    const { prompts } = control
    const { prompt } = prompts
    const { i18n } = this.props
    const text = i18n(prompt)
    const handleEdit = () => {
      const { showEditor } = this.state
      this.setState({ showEditor: !showEditor })
    }
    const handleEditKey = e => {
      if (e.type === 'click' || e.key === 'Enter') {
        handleEdit()
      }
    }
    return (
      <div
        className="creation-view-controls-add-button"
        tabIndex="0"
        role={'button'}
        title={text}
        aria-label={text}
        onClick={handleEdit}
        onKeyPress={handleEditKey}
      >
        {text}
        <AddIcon />
      </div>
    )
  }

  renderCombobox(control) {
    const { available, prompts } = control
    const { prompt } = prompts
    const { i18n } = this.props
    const text = i18n(prompt)
    const handleChange = () => {
      const { showEditor } = this.state
      this.setState({ showEditor: !showEditor })
    }
    return (
      <div className="creation-view-controls-add-combobox">
        <div className="tagInput-searchIcon">
          <Icon
            className="icon--search"
            name="icon--search"
            description={text}
          />
        </div>
        <div className={'comboBox'}>
          <ComboBox
            items={available}
            placeholder={text}
            shouldFilterItem={({ inputValue, item }) => {
              return (
                inputValue.length === 0 || item.label.indexOf(inputValue) !== -1
              )
            }}
            onChange={handleChange}
          />
        </div>
      </div>
    )
  }

  renderMultiSelect = () => {
    const { activeItemsSet } = this.state
    const { control, i18n } = this.props
    const {
      available = [],
      active = [],
      prompts,
      isLoading,
      isFailed
    } = control
    if (isFailed) {
      return (
        <Notification
          title=""
          className="overview-notification"
          kind="error"
          subtitle={i18n('overview.error.default')}
        />
      )
    }
    const loading = i18n(
      _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
    return (
      <div className="creation-view-controls-add-combobox">
        {isLoading || !activeItemsSet ? (
          <div className="creation-view-controls-singleselect-loading">
            <DropdownSkeleton />
            <InlineLoading description={loading} />
          </div>
        ) : (
          <MultiSelect.Filterable
            initialSelectedItems={active}
            itemToString={bma => _.get(bma, 'hostName')}
            items={available}
            placeholder={i18n(prompts.prompt)}
            type="default"
            onChange={({ selectedItems }) =>
              this.props.handleAddActive(selectedItems)
            }
          />
        )}
      </div>
    )
  };
}

export default ControlPanelPrompt
