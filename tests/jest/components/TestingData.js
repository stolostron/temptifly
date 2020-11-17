
export const portals = Object.freeze({
  cancelBtn: 'cancel-button-portal-id',
  createBtn: 'create-button-portal-id',
  editBtn: 'edit-button-portal-id'
})

export const control =
{
  active: 'test',
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'text',
}

export const controlData = [
  {
    id: 'main',
    type: 'section',
    note: 'creation.view.required.mark'
  },
  {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    id: 'name',
    type: 'text',
    syncWith: 'namespace'
  },
  {
    name: 'creation.app.namespace',
    tooltip: 'tooltip.creation.app.namespace',
    id: 'namespace',
    type: 'text',
    syncedWith: 'name',
    syncedSuffix: '-ns'
  }
]
