'use strict'

import React from 'react'
import ReactDOMServer from 'react-dom/server'

/*
* UI helpers to help with data transformations
* */

export const getWrappedNodeLabel = (label, width, rows=3) => {
  // if too long, add elipse and split the rest
  const ip = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.exec(label)
  if (ip) {
    label = label.substr(0, ip.index) + '\n' + ip[0]
  } else {
    if (label.length>width*rows) {
      if (rows===2) {
        label = label.substr(0, width)+ '..\n' + label.substr(-width)
      } else {
        label = splitLabel(label.substr(0, width*2), width, rows-1) + '..\n' +  label.substr(-width)
      }
    } else {
      label = splitLabel(label, width, rows)
    }
  }
  return label
}

const splitLabel = (label, width, rows) => {
  let line=''
  const lines = []
  const parts = label.split(/([^A-Za-z0-9])+/)
  let remaining = label.length
  do {
    // add label part
    line += parts.shift()

    // add splitter
    if (parts.length) {
      line += parts.shift()
    }

    // if next label part puts it over width split it
    if (parts.length) {
      if (line.length+parts[0].length > width) {
        remaining -= line.length
        if (remaining>width) {
          if (rows===2) {
            // if pentulitmate row do a hard break
            const split = parts[0]
            const idx = width - line.length
            line += split.substr(0,idx)
            parts[0] = split.substr(idx)
          }
        }
        lines.push(line)
        line = ''
        rows-=1
      }
    } else {
      // nothing left, push last line
      lines.push(line)
    }
  } while (parts.length)

  // pull last line in if too short
  if (lines.length>1) {
    let lastLine = lines.pop()
    if (lastLine.length<=2) {
      lastLine = lines.pop() + lastLine
    }
    lines.push(lastLine)
  }
  return lines.join('\n')
}

//as scale decreases from max to min, return a counter zoomed value from min to max
export const counterZoom = (scale, scaleMin, scaleMax, valueMin, valueMax) => {
  if (scale>=scaleMax) {
    return valueMin
  } else if (scale<=scaleMin) {
    return valueMax
  }
  return valueMin + (1-((scale-scaleMin)/(scaleMax-scaleMin))) * (valueMax-valueMin)
}


export const getTooltip = (tooltips) => {
  return ReactDOMServer.renderToStaticMarkup(
    <React.Fragment>
      {tooltips.map(({name, value, href, target='', rel=''}) => {
        return (<div key={Math.random()} >
          <span className='label'>{name}:  </span>
          {href ?
            <a className='link' href={href} target={target} rel={rel} >{value}</a>
            : <span className='value'>{value}</span>}
        </div>)
      })}
    </React.Fragment>)
}

export const getHashCode = (str) => {
  let hash = 0, i, chr
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return hash
}

export const getStoredObject = (storageKey) => {
  try {
    storageKey = `${storageKey} ${window.location.href}`
    const sessionObject = JSON.parse(sessionStorage.getItem(storageKey))
    if (sessionObject && sessionObject.expiresAt && sessionObject.expiresAt > Date.now()) {
      return sessionObject.sessionData
    } else {
      sessionStorage.removeItem(storageKey)
    }
  } catch (error) {
    // no privileges
  }
  return null
}

export const saveStoredObject = (storageKey, object, expiring=60) => {
  try {
    storageKey = `${storageKey} ${window.location.href}`
    const sessionObject = {
      expiresAt: Date.now() + expiring*60*1000, // expire in 60 minutes
      sessionData: object
    }
    sessionStorage.setItem(storageKey, JSON.stringify(sessionObject))
  } catch (error) {
    // no privileges
  }
}

