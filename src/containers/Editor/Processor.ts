import Viewer from './Viewer';
import { CSG, CAG } from '@jscad/csg';
import { OpenJsCad } from './OpenJsCad';

export class Processor {
    constructor(containerdiv, options, onchange) {
        this.containerdiv = containerdiv;
        this.options = options = options || {};
        this.onchange = onchange;

        // Draw black triangle lines ("wireframe")
        this.options.drawLines = !!this.cleanOption(options.drawLines, false);
        // Draw surfaces
        this.options.drawFaces = !!this.cleanOption(options.drawFaces, true);
        // verbose output
        this.options.verbose = !!this.cleanOption(options.verbose, true);

        // default applies unless sizes specified in options
        this.widthDefault = "800px";
        this.heightDefault = "600px";

        this.viewerdiv = null;
        this.viewer = null;

        this.viewerSize = {
            widthDefault: this.widthDefault,
            heightDefault: this.heightDefault,
            width: this.options.viewerwidth,
            height: this.options.viewerheight,
            heightratio: this.options.viewerheightratio
        };
        // this.viewerwidth = this.options.viewerwidth || "800px";
        // this.viewerheight = this.options.viewerheight || "600px";
        this.processing = false;
        this.currentObject = null;
        this.hasValidCurrentObject = false;
        this.hasOutputFile = false;
        this.worker = null;
        this.paramDefinitions = [];
        this.paramControls = [];
        this.script = null;
        this.hasError = false;
        this.debugging = false;
        this.createElements();
    }
    containerdiv: any;
    options: any;
    onchange: any;
    widthDefault: string;
    heightDefault: string;
    viewerdiv: any;
    viewer: Viewer;
    viewerSize: { widthDefault: string; heightDefault: string; width: any; height: any; heightratio: any; };
    processing: boolean;
    currentObject: any;
    hasValidCurrentObject: boolean;
    hasOutputFile: boolean;
    worker: any;
    paramDefinitions: any[];
    paramControls: any[];
    script: any;
    hasError: boolean;
    debugging: boolean;
    errordiv: HTMLDivElement;
    errorpre: HTMLPreElement;
    statusdiv: HTMLDivElement;
    controldiv: HTMLDivElement;
    statusspan: HTMLSpanElement;
    statusbuttons: HTMLDivElement;
    abortbutton: HTMLButtonElement;
    currentFormat: string;
    downloadOutputFileLink: HTMLAnchorElement;
    parametersdiv: HTMLDivElement;
    parameterstable: HTMLTableElement;
    filename: any;
    currentObjects: any;
    currentObjectIndex: any;
    isFirstRender_: boolean;
    outputFileDirEntry: any;
    outputFileBlobUrl: any;

    static convertToSolid(obj) {
        if ((typeof (obj) == "object") && ((obj instanceof CAG))) {
            // convert a 2D shape to a thin solid:
            obj = obj.extrude({ offset: [0, 0, 0.1] });
        }
        else if ((typeof (obj) == "object") && ((obj instanceof CSG))) {
            // obj already is a solid
        }
        else {
            throw new Error("Cannot convert to solid");
        }
        return obj;
    }

    cleanOption(option, deflt) {
        return typeof option != "undefined" ? option : deflt;
    }
    // pass "faces" or "lines"
    toggleDrawOption(str) {
        if (str == 'faces' || str == 'lines') {
            var newState = !this.viewer.drawOptions[str];
            this.setDrawOption(str, newState);
            return newState;
        }
    }
    // e.g. setDrawOption('lines', false);
    setDrawOption(str, bool) {
        if (str == 'faces' || str == 'lines') {
            this.viewer.drawOptions[str] = !!bool;
        }
        this.viewer.applyDrawOptions();
    }

    handleResize() {
        this.viewer && (this.viewer.handleResize());
    }

    createElements() {
        var that = this;//for event handlers

        while (this.containerdiv.children.length > 0) {
            this.containerdiv.removeChild(this.containerdiv.children[0]);
        }

        var viewerdiv = document.createElement("div");
        viewerdiv.className = "viewer";
        this.containerdiv.appendChild(viewerdiv);
        this.viewerdiv = viewerdiv;
        this.viewer = new Viewer(this.viewerdiv, this.viewerSize, this.options);
        this.errordiv = document.createElement("div");
        this.errorpre = document.createElement("pre");
        this.errordiv.appendChild(this.errorpre);
        this.statusdiv = document.createElement("div");
        this.statusdiv.className = "statusdiv";
        // surface/line draw
        this.controldiv = document.createElement("div");
        var this_ = this;
        [['faces', 'surfaces', this.options.drawFaces],
        ['lines', 'lines', this.options.drawLines]].forEach((tup) => {
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = 'cb_' + tup[0];
            cb.checked = tup[2];
            cb.addEventListener('click', function () { this.checked = this_.toggleDrawOption(tup[0]) });
            var lb = document.createElement('label');
            lb.htmlFor = "cb_" + tup[0];
            lb.appendChild(document.createTextNode(tup[1] + "  "));
            [cb, lb].forEach((ui) => { this.controldiv.appendChild(ui) }, this);
        }, this);
        this.statusspan = document.createElement("span");
        this.statusbuttons = document.createElement("div");
        this.statusbuttons.style.cssFloat = "right";
        this.statusdiv.appendChild(this.statusspan);
        this.statusdiv.appendChild(this.statusbuttons);
        this.statusdiv.appendChild(this.controldiv);
        this.abortbutton = document.createElement("button");
        this.abortbutton.innerHTML = "Abort";
        this.abortbutton.onclick = function (e) {
            that.abort();
        };
        this.statusbuttons.appendChild(this.abortbutton);

        this.downloadOutputFileLink = document.createElement("a");
        this.statusbuttons.appendChild(this.downloadOutputFileLink);
        this.parametersdiv = document.createElement("div");
        this.parametersdiv.className = "parametersdiv";
        var headerdiv = document.createElement("div");
        headerdiv.textContent = "Parameters:";
        headerdiv.className = "header";
        this.parametersdiv.appendChild(headerdiv);
        this.parameterstable = document.createElement("table");
        this.parameterstable.className = "parameterstable";
        this.parametersdiv.appendChild(this.parameterstable);
        var parseParametersButton = document.createElement("button");
        parseParametersButton.innerHTML = "Update";
        parseParametersButton.onclick = function (e) {
            that.rebuildSolid();
        };
        this.parametersdiv.appendChild(parseParametersButton);
        this.enableItems();
        this.containerdiv.appendChild(this.statusdiv);
        this.containerdiv.appendChild(this.errordiv);
        this.containerdiv.appendChild(this.parametersdiv);
        this.clearViewer();
    }

    setRenderedObjects(obj) {
        // if obj is a single CSG or CAG, convert to the array format:
        if (obj === null) {
            obj = [];
        }
        else {
            if (!(obj instanceof Array)) {
                obj = [
                    {
                        data: obj,
                    },
                ];
            }
        }
        this.currentObjects = obj;

        this.setSelectedObjectIndex((obj.length > 0) ? 0 : -1);
    }
    randomNum() {
        return Math.floor(Math.random() * 256);
        
        // return (Math.random().toFixed(1));
    }
    renderItems(items: any[]) {
        this.clearOutputFile();
        var solids = items.map((item, index) => {
            return { value: Processor.convertToSolid(item), color: [this.randomNum(), this.randomNum(), this.randomNum()] };
        });
        this.viewer.setItems(solids);
    }

    setSelectedObjectIndex(index) {
        this.clearOutputFile();
        var obj;
        if (index < 0) {
            obj = null;
        }
        else {
            obj = this.currentObjects[index];
        }
        this.currentObjectIndex = index;
        this.currentObject = obj;

        if (obj !== null) {
            var csg = Processor.convertToSolid(obj);
            // // reset zoom unless toggling between valid objects
            // this.viewer.setCsg(csg, !this.hasValidCurrentObject);
            this.isFirstRender_ = typeof this.isFirstRender_ == 'undefined' ? true : false;
            // (re-)set zoom only on very first rendering action
            this.viewer.setCsg(csg, this.isFirstRender_);
            this.hasValidCurrentObject = true;

        } else {
            this.viewer.clear();
            this.hasValidCurrentObject = false;
        }


    }

    clearViewer() {
        this.clearOutputFile();
        this.setRenderedObjects(null);
        this.hasValidCurrentObject = false;
        this.enableItems();
    }

    abort() {
        if (this.processing) {
            //todo: abort
            this.processing = false;
            this.statusspan.innerHTML = "Aborted.";
            this.worker.terminate();
            this.enableItems();
            if (this.onchange) this.onchange();
        }
    }

    enableItems() {
        this.abortbutton.style.display = this.processing ? "inline" : "none";
        this.downloadOutputFileLink.style.display = this.hasOutputFile ? "inline" : "none";
        this.parametersdiv.style.display = (this.paramControls.length > 0) ? "block" : "none";
        this.errordiv.style.display = this.hasError ? "block" : "none";
        this.statusdiv.style.display = this.hasError ? "none" : "block";
    }

    setOpenJsCadPath(path) {
        this.options['openJsCadPath'] = path;
    }

    addLibrary(lib) {
        if (typeof this.options['libraries'] == 'undefined') {
            this.options['libraries'] = [];
        }
        this.options['libraries'].push(lib);
    }

    setError(txt) {
        this.hasError = (txt != "");
        this.errorpre.textContent = txt;
        this.enableItems();
    }

    setDebugging(debugging) {
        this.debugging = debugging;
    }

    // script: javascript code
    // filename: optional, the name of the .jscad file
    setJsCad(script, filename) {
        if (!filename) filename = "openjscad.jscad";
        filename = filename.replace(/\.jscad$/i, "");
        this.abort();
        this.clearViewer();
        this.paramDefinitions = [];
        this.paramControls = [];
        this.script = null;
        this.setError("");
        var scripthaserrors = false;
        try {
            this.paramDefinitions = OpenJsCad.getParamDefinitions(script);
            this.createParamControls();
        }
        catch (e) {
            console.error(e);
            this.setError(e.toString());
            this.statusspan.innerHTML = "Error.";
            scripthaserrors = true;
        }
        if (!scripthaserrors) {
            this.script = script;
            this.filename = filename;
            this.rebuildSolid();
        }
        else {
            this.enableItems();
            if (this.onchange) this.onchange();
        }
    }

    getParamValues() {
        var paramValues = {};
        for (var i = 0; i < this.paramDefinitions.length; i++) {
            var paramdef = this.paramDefinitions[i];
            var type = "text";
            if ('type' in paramdef) {
                type = paramdef.type;
            }
            var control = this.paramControls[i];
            var value;
            if ((type == "text") || (type == "longtext") || (type == "float") || (type == "int")) {
                value = control.value;
                if ((type == "float") || (type == "int")) {
                    var isnumber = !isNaN(parseFloat(value)) && isFinite(value);
                    if (!isnumber) {
                        throw new Error("Not a number: " + value);
                    }
                    if (type == "int") {
                        value = parseInt(value, 10);
                    }
                    else {
                        value = parseFloat(value);
                    }
                }
            }
            else if (type == "choice") {
                value = control.options[control.selectedIndex].value;
            }
            else if (type == "bool") {
                value = control.checked;
            }
            paramValues[paramdef.name] = value;
        }
        return paramValues;
    }

    rebuildSolid() {
        this.abort();
        this.setError("");
        this.clearViewer();
        this.processing = true;
        this.statusspan.innerHTML = "Processing, please wait...";
        this.enableItems();
        var that = this;
        var paramValues = this.getParamValues();
        var useSync = this.debugging;
        var options = {};
        var startTime = Date.now();

        if (!useSync) {
            this.worker = OpenJsCad.parseJsCadScriptASync(this.script, paramValues, this.options, function (err, obj) {
                that.processing = false;
                that.worker.terminate();
                that.worker = null;
                if (err) {
                    console.error(err);
                    that.setError(err);
                    that.statusspan.innerHTML = "Error.";
                }
                else {
                    that.setRenderedObjects(obj);
                    var currentTime = Date.now();
                    var elapsed = (currentTime - startTime);
                    that.statusspan.innerHTML = "Ready." + (that.options.verbose ?
                        "  Rendered in " + elapsed + "ms" : "");
                }
                that.enableItems();
                if (that.onchange) that.onchange();
            });
        }
        else {
            try {
                var obj = OpenJsCad.parseJsCadScriptSync(this.script, paramValues, this.debugging);
                that.setRenderedObjects(obj);
                that.processing = false;
                that.statusspan.innerHTML = "Ready.";
            }
            catch (e) {
                that.processing = false;
                var errtxt = e.toString();
                if (e.stack) {
                    errtxt += '\nStack trace:\n' + e.stack;
                }
                that.setError(errtxt);
                console.error(e);
                that.statusspan.innerHTML = "Error.";
            }
            that.enableItems();
            if (that.onchange) that.onchange();
        }
    }

    hasSolid() {
        return this.hasValidCurrentObject;
    }

    isProcessing() {
        return this.processing;
    }

    clearOutputFile() {
        if (this.hasOutputFile) {
            this.hasOutputFile = false;
            if (this.outputFileDirEntry) {
                this.outputFileDirEntry.removeRecursively(function () { });
                this.outputFileDirEntry = null;
            }
            if (this.outputFileBlobUrl) {
                OpenJsCad.revokeBlobUrl(this.outputFileBlobUrl);
                this.outputFileBlobUrl = null;
            }
            this.enableItems();
            if (this.onchange) this.onchange();
        }
    }

    supportedFormatsForCurrentObject() {
        if (this.currentObject instanceof CSG) {
            return ["stl", "x3d"];
        } else if (this.currentObject instanceof CAG) {
            return ["dxf"];
        } else {
            throw new Error("Not supported");
        }
    }

    formatInfo(format) {
        return {
            stl: {
                displayName: "STL",
                extension: "stl",
                mimetype: "application/sla",
            },
            x3d: {
                displayName: "X3D",
                extension: "x3d",
                mimetype: "model/x3d+xml",
            },
            dxf: {
                displayName: "DXF",
                extension: "dxf",
                mimetype: "application/dxf",
            }
        }[format];
    }

    createParamControls() {
        this.parameterstable.innerHTML = "";
        this.paramControls = [];
        var paramControls = [];
        var tablerows = [];
        for (var i = 0; i < this.paramDefinitions.length; i++) {
            var errorprefix = "Error in parameter definition #" + (i + 1) + ": ";
            var paramdef = this.paramDefinitions[i];
            if (!('name' in paramdef)) {
                throw new Error(errorprefix + "Should include a 'name' parameter");
            }
            var type = "text";
            if ('type' in paramdef) {
                type = paramdef.type;
            }
            if ((type !== "text") && (type !== "int") && (type !== "float") && (type !== "choice") && (type !== "longtext") && (type !== "bool")) {
                throw new Error(errorprefix + "Unknown parameter type '" + type + "'");
            }
            var initial;
            if ('initial' in paramdef) {
                initial = paramdef.initial;
            }
            else if ('default' in paramdef) {
                initial = paramdef['default'];
            }
            var control;
            if ((type == "text") || (type == "int") || (type == "float")) {
                control = document.createElement("input");
                control.type = "text";
                if (initial !== undefined) {
                    control.value = initial;
                }
                else {
                    if ((type == "int") || (type == "float")) {
                        control.value = "0";
                    }
                    else {
                        control.value = "";
                    }
                }
            }
            else if (type == "choice") {
                if (!('values' in paramdef)) {
                    throw new Error(errorprefix + "Should include a 'values' parameter");
                }
                control = document.createElement("select");
                var values = paramdef.values;
                var captions;
                if ('captions' in paramdef) {
                    captions = paramdef.captions;
                    if (captions.length != values.length) {
                        throw new Error(errorprefix + "'captions' and 'values' should have the same number of items");
                    }
                }
                else {
                    captions = values;
                }
                var selectedindex = 0;
                for (var valueindex = 0; valueindex < values.length; valueindex++) {
                    var option = document.createElement("option");
                    option.value = values[valueindex];
                    option.text = captions[valueindex];
                    control.add(option);
                    if (initial !== undefined) {
                        if (initial == values[valueindex]) {
                            selectedindex = valueindex;
                        }
                    }
                }
                if (values.length > 0) {
                    control.selectedIndex = selectedindex;
                }
            }
            else if (type == "longtext") {
                control = document.createElement("textarea");
                if (initial !== undefined) {
                    control.value = initial;
                }
                else {
                    control.value = "";
                }
            }
            else if (type == "bool") {
                control = document.createElement("input");
                control.type = "checkbox";
                if (initial !== undefined) {
                    if (typeof (initial) != "boolean") {
                        throw new Error(errorprefix + "initial/default of type 'bool' has to be boolean (true/false)");
                    }
                    control.checked = initial;
                }
                else {
                    control.checked = false;
                }
            }
            paramControls.push(control);
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var label = paramdef.name + ":";
            if ('caption' in paramdef) {
                label = paramdef.caption;
            }
            if ('visible' in paramdef) {
                tr.style.display = (paramdef.visible) ? "table-row" : "none";
            }

            td.innerHTML = label;
            tr.appendChild(td);
            td = document.createElement("td");
            td.appendChild(control);
            tr.appendChild(td);
            tablerows.push(tr);
        }
        var that = this;
        tablerows.map(function (tr) {
            that.parameterstable.appendChild(tr);
        });
        this.paramControls = paramControls;
    }

}

export default Processor;