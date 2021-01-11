'use strict'

import React, {
    Fragment,
} from 'react'
import PropTypes from 'prop-types'
import {
    Pagination,
    PaginationVariant,
    SearchInput,
    Spinner,
    Split,
    SplitItem,
    Title,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core'
import {
    IRow,
    ISortBy,
    RowWrapper,
    RowWrapperProps,
    sortable,
    SortByDirection,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table'
import { ControlMode } from '../utils/source-utils'
import {
  TrashIcon,
} from '../icons/Icons'
import _ from 'lodash'

const translateWithId = (i18n, id) => i18n(id)

const add = 'table.actions.add'
const remove = 'table.actions.remove'
const edit = 'table.actions.edit'

const PAGE_SIZES = {
  DEFAULT: 5,
  VALUES: [5, 10, 20, 50, 75, 100]
}

class ControlPanelTable extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func
  };

  static getDerivedStateFromProps(props, state) {
    const { control } = props
    const { id, isLoaded, available } = control
    const { pageSize } = state
    localStorage.setItem(`table-${id}-page-size`, pageSize)
    if (!state.originalSet) {
      return { originalSet: new Set(isLoaded ? Object.keys(_.keyBy(available, 'id')) : []) }
    }
    return null
  }

  componentDidUpdate(prevProps) {
    const { fetchData } = this.props
    if (
      !prevProps.control.isLoading &&
      !this.props.control.isLoading &&
      !this.loaded
    ) {
      this.loaded = true
      const requestedUIDs = _.get(fetchData, 'requestedUIDs', [])
      requestedUIDs.forEach(uid => this.handleSelect(uid))
    }
  }

  constructor(props) {
    super(props)
    const { control: { id, controlData } } = props
    this.state = {
      pageSize:
        parseInt(localStorage.getItem(`table-${id}-page-size`), 10) ||
        PAGE_SIZES.DEFAULT,
      sortBy: {},
      searchValue: ''
    }
    
    this.headers = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ id }) => id )
    this.handleSelect = this.handleSelect.bind(this)
    this.loaded = false
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSort = this.handleSort.bind(this);
  }

  getColumns() {
    const { control: { controlData } } = this.props
    const headers = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ id, name }) => ({title: name, transforms: [sortable] }))
    headers.push({ key: 'action', title: '' })
    return headers
  }

  getRows() {
    const { i18n, control } = this.props
    const { prompts = {}, sortTable, active } = control
    const { deletePrompt = '' } = prompts
    const text = i18n(deletePrompt)
    const { controlData, available = [] } = control
    const columns = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ id }) => ({ key: id }))
    const { sortBy, searchValue } = this.state
    const { selectedKey, direction } = sortBy
    let items = _.cloneDeep(available)
    if (selectedKey) {
      items = sortTable
        ? sortTable(items, selectedKey, direction, active)
        : _.orderBy(items, [selectedKey], [sortDirection])
    }
    const searchKey = _.get(columns, '[0].key')
    if (searchValue && searchKey) {
      items = items.filter(item => {
        return _.get(item, searchKey, '').indexOf(searchValue) !== -1
      })
    }
    const activeMap = _.keyBy(active, 'id')
    return items.map((item, inx) => {
//      const { id } = item
//      const row = { id }
//      const handleDeleteRow = this.handleTableAction.bind(this, remove, inx)
//      const handleDeleteRowKey = e => {
//        if (e.type === 'click' || e.key === 'Enter') {
//          handleDeleteRow()
//        }
//      }
//      columns.forEach(column => {
//        row[column.key] =
//          item[column.key] !== undefined ? item[column.key] : '-'
//      })
//      if (deletePrompt) {
//        row.action = (
//          <div
//            className="creation-view-controls-table-delete-button"
//            tabIndex="0"
//            role={'button'}
//            title={text}
//            aria-label={text}
//            onClick={handleDeleteRow}
//            onKeyPress={handleDeleteRowKey}
//          >
//            <TrashIcon />
//          </div>
//        )
//      }
       const {
        id,
        hostName,
        hostNamespace,
        role,
        bmcAddress
      } = item
      return {
        cells: [hostName, hostNamespace, role, bmcAddress], 
        selected: !!activeMap[id]
      }
    })
  }
  
  handleSort(event, index, direction) {
    this.setState({
      sortBy: {
        index,
        selectedKey: this.headers[index-1],
        direction
      },
    })
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { control, i18n } = this.props
    const { exception } = control
    const { page = 1, pageSize } = this.state
    let rows = this.getRows()
    const totalFilteredItems = rows.length
    const inx = (page - 1) * pageSize
    rows = rows.slice(inx, inx + pageSize)
    return (
      <div
        className="creation-view-controls-table-container"
        ref={this.setControlRef.bind(this, control)}
      >
        <div className="creation-view-controls-table">
          {this.renderTree(rows)}
         </div>
        {exception && (
          <div className="creation-view-controls-table-exceptions">
            {exception}
          </div>
        )}
      </div>
    )
  }

    renderTree(rows) {
      const { control, i18n } = this.props
      const { sortBy } = this.state
      const { isLoading, isFailed, prompts = {}, available } = control
      let { active } = control
      if (!Array.isArray(active)) {
        active = []
      }
      const columns = this.getColumns()
//      if (isFailed) {
//        return (
//          <Notification
//            title=""
//            className="overview-notification"
//            kind="error"
//            subtitle={i18n('overview.error.default')}
//          />
//        )
//      } else if (isLoading) {
//        return (
//          <DataTableSkeleton
//            columnCount={headers.length - 1}
//            compact={false}
//            rowCount={3}
//            showheader={'true'}
//            showtoolbar={'true'}
//            zebra={false}
//          />
//        )
//      } else {
        const { id, exceptions = [] } = control
        const {
          searchValue,
          originalSet
        } = this.state
        let { actions } = prompts
        actions = React.Children.map(actions, action => {
          return React.cloneElement(action, {
            appendTable: this.handleTableAction.bind(this, add)
          })
        })
        const activeSet = new Set(Object.keys(_.keyBy(active, 'id')))
        return (
          <Fragment>
                <Toolbar>
                    <ToolbarContent>
                            <ToolbarItem>
                                <SearchInput
                                    style={{ minWidth: '350px' }}
                                    placeholder={i18n('search.label')}
                                    value={searchValue}
                                    onChange={(value) => {
                                        this.setState({
                                          searchValue: value || '',
                                          page: 1
                                        })
                                    }}
                                    onClear={() => {
                                        this.setState({
                                          searchValue: '',
                                          page: 1
                                        })
                                    }}
                                    resultsCount={`${rows.length} / ${available.length}`}
                                />
                            </ToolbarItem>
                            <div style={{display: 'flex'}}>
                            
                                     {actions.map((action) => (
                                        <ToolbarItem key={action.id}>
                                          {action}
                                         </ToolbarItem>
                                    ))}
                           
                             </div>

                            
                    </ToolbarContent>
                </Toolbar>
          
          <Fragment>
          <Table 
            aria-label="BMA Table"
            sortBy={sortBy} 
            onSort={this.handleSort}             
            onSelect={this.handleSelect} 
            canSelectAll={true}
            cells={columns} 
            rows={rows}>
            <TableHeader />
            <TableBody />
          </Table>
          </Fragment>
          </Fragment>
         
          
          
              )
    }

  handleSelect(event, isSelected, rowId) {
    const { control } = this.props
    const { available, controlData } = control
    let { active=[] } = control
    if (rowId !== -1) {
      const {id} = available[rowId]
      const activeMap = _.keyBy(active, 'id')
      
      if (!activeMap[id]) {
        // add to active
        this.addActives(active, [available[rowId]], controlData)
      } else {
        // remove from active
        const inx = active.findIndex(data => id === data.id)
        active.splice(inx, 1)
      }
    } else {
      control.active = [];
      ({ active } = control)
      if (isSelected) {
        this.addActives(active, available, controlData)
      }
    }
    this.props.handleChange(control)
  };

  addActives(active, actives, controlData) {
    actives.forEach(value => {
      Object.keys(value).forEach(
        key => value[key] === null && delete value[key]
      )
      active.push({
        ...this.getDefaults(active, actives, controlData),
        ...value
      })
    })
  }

  getDefaults(active, actives, controlData) {
    const defaults = {}
    controlData.forEach(({ id: _id, active: _active }) => {
      if (_active) {
        defaults[_id] =
          typeof _active === 'function' ? _active(active) : _active
      }
    })
    return defaults
  }

  handleCellEdit(rinx, header, type, e) {
    const { control } = this.props
    const { active, controlData } = control
    const availableMap = _.keyBy(controlData, 'id')
    const [checked, unchecked] = _.get(availableMap, `${header}.available`, [])
    let value
    switch (type) {
    case 'singleselect':
      value = e.selectedItem
      break
    case 'toggle':
      value = e ? checked : unchecked
      break
    }
    _.set(active, `${rinx}.${header}`, value)
    this.props.handleChange(control)
  }

  handleTableAction(action, data) {
    const { control } = this.props
    let { active, available } = control
    if (!Array.isArray(active)) {
      control.active = []
      active = control.active
    }
    if (!Array.isArray(available)) {
      control.available = []
      available = control.available
    }
    const existingMap = _.keyBy(available, ({ hostName, hostNamespace }) => {
      return `${hostName}-${hostNamespace}`
    })
    switch (action) {
    case remove:
      active.splice(data, 1)
      break
    case add:
      if (Array.isArray(data)) {
        data.reverse()
      } else {
        data = [data]
      }
      data = data.filter(({ hostName, hostNamespace }) => {
        return !existingMap[`${hostName}-${hostNamespace}`]
      })
      data.forEach(datum => {
        datum.isNew = true
        available.unshift(datum)
        active.unshift(datum)
      })
      break
    case edit:
    default:
      break
    }
    this.props.handleChange(control)
  }
}

export default ControlPanelTable
