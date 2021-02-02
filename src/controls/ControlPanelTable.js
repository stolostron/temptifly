'use strict'

import React, {
  Fragment,
} from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Pagination,
  PaginationVariant,
  SearchInput,
  Spinner,
  Split,
  SplitItem,
  Title,
  Toolbar,
  ToolbarContent,
  SelectOption,
  ToolbarItem,
} from '@patternfly/react-core'
import {
  sortable,
  EditableSelectInputCell,
  Table,
  TableBody,
  TableHeader,
  TableVariant
} from '@patternfly/react-table'
import { ControlMode } from '../utils/source-utils'
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon'
import keyBy from 'lodash/keyBy'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import set from 'lodash/set'

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
    const { id, isLoaded } = control
    const { available=[] } = control
    const { perPage } = state
    let { rows=[] } = state
    const newState = {}
    localStorage.setItem(`table-${id}-page-size`, perPage)
    if (!state.originalSet) {
      newState.originalSet = new Set(isLoaded ? Object.keys(keyBy(available, 'id')) : [])
    }
    const { active } = control
    const { controlData } = control
    const { onSelect, onToggle, clearSelection } = state
    const columns = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ id }) => ({ key: id }))
    newState.columns = columns
    const availableMap = keyBy(available, 'id')
    rows = rows.filter(({id})=>!!availableMap[id])
    if (rows.length !== available.length) {
      rows = cloneDeep(available)
    }
    const activeMap = keyBy(active, 'id')
    newState.rows = rows.map(row => {
      const { id } = row

      // create table rows
      if (!row.cells) {
        const cells = controlData
          .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
          .map(data=>{
            const {id:rid, type, available} = data
            switch(type) {
            case 'text':
              return row[rid]
            case 'toggle':
              return  {
                title: (value, rowIndex, cellIndex, props) => (
                  <EditableSelectInputCell
                    value={value}
                    rowIndex={rowIndex}
                    cellIndex={cellIndex}
                    props={props}
                    onSelect={onSelect}
                    clearSelection={clearSelection}
                    /* eslint-disable-next-line react/prop-types */
                    isOpen={props.isSelectOpen}
                    /* eslint-disable-next-line react/prop-types */
                    options={props.options.map((option, index) => (
                      <SelectOption
                        /* eslint-disable-next-line react/no-array-index-key */
                        key={index}
                        value={option.value}
                        id={rid + index}
                      />
                    ))}
                    onToggle={isOpen => {
                      onToggle(isOpen, rowIndex, cellIndex)
                    }}
                    /* eslint-disable-next-line react/prop-types */
                    selections={props.selected}
                  />
                ),
                props: {
                  value: row[rid],
                  name: rid,
                  isSelectOpen: false,
                  selected: [row[rid]],
                  options: available.map(value=>{return {value}}),
                  editableSelectProps: {
                    variant: 'single',
                    'aria-label': rid
                  }
                }
              }
            }
          })
        return {
          id,
          cells,
          selected: !!activeMap[id],
          rowEditBtnAriaLabel: idx => `Edit row ${idx}`,
          rowSaveBtnAriaLabel: idx => `Save edits for row ${idx}`,
          rowCancelBtnAriaLabel: idx => `Cancel edits for row ${idx}`,

        }
      } else {
        // update table row
        row.selected = !!activeMap[id]
        if (!row.isEditable) {
          row.cells.forEach(cell=>{
            const {props} = cell||{}
            if (props && activeMap[id]) {
              /* eslint-disable-next-line react/prop-types */
              const {name} = props
              const value = activeMap[id][name]
              /* eslint-disable-next-line react/prop-types */
              props.selected = value
              /* eslint-disable-next-line react/prop-types */
              props.value = value
            }
          })
        }
        return row
      }
    })
    return newState
  }

  constructor(props) {
    super(props)
    const { control: { id, controlData } } = props
    this.state = {
      perPage:
        parseInt(localStorage.getItem(`table-${id}-page-size`), 10) ||
        PAGE_SIZES.DEFAULT,
      sortBy: {},
      searchValue: '',
      onSelect: this.onSelect.bind(this),
      onToggle: this.onToggle.bind(this),
      clearSelection: this.clearSelection.bind(this),
    }
    this.headers = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ id }) => id )
    this.loaded = false
    this.handleSelect = this.handleSelect.bind(this)
    this.handleSort = this.handleSort.bind(this)
    this.updateEditableRows = this.updateEditableRows.bind(this)
  }

  componentDidUpdate(prevProps) {
    const { fetchData, control } = this.props
    if (
      !prevProps.control.isLoading &&
      !control.isLoading &&
      !this.loaded
    ) {
      this.loaded = true
      const { available } = control
      const requestedUIDs = get(fetchData, 'requestedUIDs', [])
      requestedUIDs.forEach(uid => {
        const rowInx = available.findIndex(({id})=>id===uid)
        this.handleSelect(null, true, rowInx)
      })
    }
  }

  getColumns() {
    const { control: { controlData } } = this.props
    const headers = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ name }) => ({title: name, transforms: [sortable] }))
    headers.push({ key: 'action', title: '' })
    return headers
  }

  handleSort(event, index, direction) {
    this.setState({
      sortBy: {
        index,
        sortIndex: index,
        direction
      },
    })
  }

  getFilteredRows() {
    const { sortBy, searchValue } = this.state
    let { rows } = this.state
    const { control } = this.props
    const { sortTable, active, controlData } = control
    const { sortIndex, direction } = sortBy
    rows = cloneDeep(rows)
    if (sortIndex) {
      if (sortTable) {
        const sortKey = get(controlData, `[${sortIndex-1}].id`)
        rows = sortTable(rows, sortKey, direction, active)
      } else {
        rows = orderBy(rows, [`cells[${sortIndex-1}]`], [direction])
      }
    }
    if (searchValue) {
      rows = rows.filter(row => {
        return get(row, 'cells[0]', '').indexOf(searchValue) !== -1
      })
    }
    return rows
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  };

  render() {
    const { control } = this.props
    const { exception } = control
    const { page = 1, perPage } = this.state
    let rows = this.getFilteredRows()
    const inx = (page - 1) * perPage
    rows = rows.slice(inx, inx + perPage)
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
    const { sortBy, page, perPage } = this.state
    const { isLoading, isFailed, prompts = {}, available } = control
    let { active } = control
    if (!Array.isArray(active)) {
      active = []
    }
    let { actions } = prompts
    actions = React.Children.map(actions, action => {
      return React.cloneElement(action, {
        appendTable: this.handleTableAction.bind(this, add)
      })
    })
    const columns = this.getColumns()
    if (isFailed) {
      return (
        <Alert
          variant='danger'
          title={i18n('overview.error.default')}
        />
      )
    } else if (isLoading) {
      return (<EmptyState>
        <EmptyStateIcon variant="container" component={Spinner} />
        <Title size="lg" headingLevel="h4">
          Loading
        </Title>
      </EmptyState>)
    } else if ( available.length===0 ) {
      return (

        <EmptyState>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h4" size="lg">
            No Bare Metal Assets
          </Title>
          <EmptyStateBody>
            There are no Bare Metal Assets currently defined.
          </EmptyStateBody>
          <div className='tf-table-button-container'>
            {actions}
          </div>
        </EmptyState>
      )
    } else {
      const {
        searchValue,
      } = this.state
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
                {actions.map((action, inx) => (
                /* eslint-disable-next-line react/no-array-index-key */
                  <ToolbarItem key={inx}>
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
              onRowEdit={this.updateEditableRows}
              canSelectAll={true}
              variant={TableVariant.compact}
              cells={columns}
              rows={rows}>
              <TableHeader />
              <TableBody />
            </Table>
            <Split>
              <SplitItem isFilled></SplitItem>
              <SplitItem>
                {rows.length !== 0 && (
                  <Pagination
                    itemCount={available.length}
                    perPage={perPage}
                    page={page}
                    variant={PaginationVariant.bottom}
                    onSetPage={(_event, page) => {
                      this.setState({
                        page
                      })
                    }}
                    onPerPageSelect={(_event, perPage) => {
                      this.setState({
                        perPage,
                        page: 1
                      })
                    }}
                  />
                )}
              </SplitItem>
            </Split>
          </Fragment>
        </Fragment>
      )
    }
  }

  handleSelect(event, isSelected, rowId) {
    const { control } = this.props
    const { available, controlData } = control
    let { active=[] } = control
    if (rowId !== -1) {
      const {id} = available[rowId]
      const activeMap = keyBy(active, 'id')

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
  }

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

  onSelect(newValue, evt, rowIndex, cellIndex, isPlaceholder) {
    this.setState(prevState=>{
      const newRows = Array.from(prevState.rows)
      const newCellProps = newRows[rowIndex].cells[cellIndex].props

      if (isPlaceholder) {
        newCellProps.editableValue = []
        newCellProps.selected = []
      } else if (newCellProps.selected) {
        if (newCellProps.editableValue === undefined) {
          newCellProps.editableValue = []
        }
        let newSelected = Array.from(newCellProps.selected)
        switch (newCellProps.editableSelectProps.variant) {
        case 'typeaheadmulti':
        case 'checkbox': {
          if (!newSelected.includes(newValue)) {
            newSelected.push(newValue)
          } else {
            newSelected = newSelected.filter(el => el !== newValue)
          }
          break
        }
        default: {
          newSelected = newValue
        }
        }
        newCellProps.editableValue = newSelected
        newCellProps.selected = newSelected
      }
      return {
        rows: newRows
      }
    })
  }

  clearSelection(rowIndex, cellIndex) {
    this.setState(prevState=>{
      const newRows = Array.from(prevState.rows)
      const newCellProps = newRows[rowIndex].cells[cellIndex].props
      newCellProps.editableValue = []
      newCellProps.selected = []
      return {
        rows: newRows
      }
    })
  }

  onToggle(isOpen, rowIndex, cellIndex) {
    this.setState(prevState=>{
      const newRows = Array.from(prevState.rows)
      newRows[rowIndex].cells[cellIndex].props.isSelectOpen = isOpen
      return {
        rows: newRows
      }
    })
  }

  updateEditableRows(evt, type, isEditable, rowIndex) {
    this.setState(prevState=>{
      const newRows = Array.from(prevState.rows)
      const { control } = this.props
      const { active, available, controlData } = control
      const activeMap = keyBy(active, 'id')
      const {id} = available[rowIndex]
      switch (type) {
      case 'cancel':
        newRows[rowIndex].isEditable = false
        break
      case 'save':
        newRows[rowIndex].cells.forEach(({props})=>{
          if (props) {
            const {name} = props
            let {editableValue} = props
            if (!editableValue) {
              const controlDataMap = keyBy(controlData, 'id')
              const _active = controlDataMap[name].active
              editableValue = typeof _active === 'function' ? _active(editableValue) : _active
            }
            set(activeMap[id], `${name}`, editableValue)
            props.value = editableValue
          }
        })
        this.props.handleChange(control)
        newRows[rowIndex].isEditable = false
        break
      case 'edit':
        newRows[rowIndex].isEditable = true

        // make sure this row is active'
        if (!activeMap[id]) {
          this.addActives(active, [available[rowIndex]], controlData)
        }
        break
      }
      return { rows: newRows }
    })
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
    const existingMap = keyBy(available, ({ hostName, hostNamespace }) => {
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
