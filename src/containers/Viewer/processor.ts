import { mergeSolids } from '@jscad/core/utils/mergeSolids';
import { formats } from '@jscad/core/io/formats';
import * as Viewer from './jscad-viewer';

export class Processor {
  constructor(containerdiv, options) {
    if (options === undefined) options = {}
    this.opts = {
      debug: false,
      libraries: [],
      openJsCadPath: '',
      useAsync: true,
      useSync: true,
      viewer: {}
    }
    for (var x in this.opts) {
      if (x in options) this.opts[x] = options[x]
    }

    this.containerdiv = containerdiv
    this.viewer = null
    this.onchange = null // function(Processor) for callback
    this.currentObjects = [] // list of objects returned from rebuildObject*
    this.viewedObject = null // the object being rendered
    this.selectStartPoint = 0
    this.selectEndPoint = 0

    // FIXME: UI only, seperate
    this.createElements()
  }
  viewer;
  onchange;
  viewedObject;
  currentObjects;
  opts;
  containerdiv;
  selectStartPoint;
  selectEndPoint;

  private revokeBlobUrl(url) {
    if (window.URL) window.URL.revokeObjectURL(url)
    else if (window["webkitURL"]) window["webkitURL"].revokeObjectURL(url)
    else throw new Error("Your browser doesn't support window.URL")
  }

  private createElements() {
    var that = this // for event handlers

    while (this.containerdiv.children.length > 0) {
      this.containerdiv.removeChild(0)
    }

    var viewerdiv = document.createElement('div')
    viewerdiv.className = 'viewer'
    viewerdiv.style.width = '100%'
    viewerdiv.style.height = '100%'
    this.containerdiv.appendChild(viewerdiv)
    try {
      this.viewer = new Viewer(viewerdiv, this.opts.viewer)
    } catch (e) {
      console.log(e);
      viewerdiv.innerHTML = '<b><br><br>Error: ' + e.toString() + '</b><br><br>A browser with support for WebGL is required'
    }

    this.clearViewer()
  }
  private clearViewer() {
    if (this.viewedObject) {
      this.viewer.clear()
      this.viewedObject = null
      if (this.onchange) this.onchange(this)
    }
  }

  public setCurrentObjects(objs) {
    this.currentObjects = objs // list of CAG or CSG objects

    this.selectStartPoint = -1 // force view update
    this.updateView()

    if (this.onchange)
      this.onchange(this)
  }
  private updateView() {
    var startpoint = 0
    var endpoint = 0
    if (startpoint === this.selectStartPoint && endpoint === this.selectEndPoint) {
      return
    }

    // build a list of objects to view
    this.selectStartPoint = startpoint
    this.selectEndPoint = endpoint
    if (startpoint > endpoint) {
      startpoint = this.selectEndPoint;
      endpoint = this.selectStartPoint
    }

    var objs = this.currentObjects.slice(startpoint, endpoint + 1)
    this.viewedObject = mergeSolids(objs)

    if (this.viewer) {
      this.viewer.setCsg(this.viewedObject)
    }
  }
}
