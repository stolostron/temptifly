'use strict'

module.exports.if_existsFn = (array, opts) => {
  if (array && array.length > 1) {
    return opts.fn(this)
  } else if (array && array.length === 1) {
    if (typeof array[0] === 'object') {
      const emptyVals = Object.keys(array[0]).filter(key => array[0][key] === '')
      return emptyVals.length < 1 ? opts.fn(this) : opts.inverse(this)
    } else if (array[0] !== '') {
      return opts.fn(this)
    } else {
      return opts.inverse(this)
    }
  } else {
    return opts.inverse(this)
  }
}
