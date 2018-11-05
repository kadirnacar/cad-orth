import { CSG, CAG } from '@jscad/csg';
// import { CSG, CAG } from '../../utils/CSG.js';

export class OpenJsCad {
  constructor() {

  }

  // make a full url path out of a base path and url component.
  // url argument is interpreted as a folder name if it ends with a slash
  static makeAbsoluteUrl(url, baseurl) {
    if (!url.match(/^[a-z]+\:/i)) {
      var re = /^\/|\/$/g;
      if (baseurl[baseurl.length - 1] != '/') {
        // trailing part is a file, not part of base - remove
        baseurl = baseurl.replace(/[^\/]*$/, "");
      }
      if (url[0] == '/') {
        var basecomps = baseurl.split('/');
        url = basecomps[0] + '//' + basecomps[2] + '/' + url.replace(re, "");
      }
      else {
        url = (baseurl.replace(re, "") + '/' + url.replace(re, ""))
          .replace(/[^\/]+\/\.\.\//g, "");
      }
    }
    return url;
  };

  static isChrome() {
    return (navigator.userAgent.search("Chrome") >= 0);
  };

  // This is called from within the web worker. Execute the main() function of the supplied script
  // and post a message to the calling thread when finished
  static runMainInWorker(mainParameters) {
    // try {
    //   if (typeof (main) != 'function') throw new Error('Your jscad file should contain a function main() which returns a CSG solid or a CAG area.');
    //   var result = main(mainParameters);
    //   result = OpenJsCad.expandResultObjectArray(result);
    //   OpenJsCad.checkResult(result);
    //   var result_compact = OpenJsCad.resultToCompactBinary(result);
    //   result = null; // not needed anymore
    //   self.postMessage({ cmd: 'rendered', result: result_compact });
    // }
    // catch (e) {
    //   var errtxt = e.toString();
    //   if (e.stack) {
    //     errtxt += '\nStack trace:\n' + e.stack;
    //   }
    //   self.postMessage({ cmd: 'error', err: errtxt });
    // }
  };

  // expand an array of CSG or CAG objects into an array of objects [{data: <CAG or CSG object>}]
  static expandResultObjectArray(result) {
    if (result instanceof Array) {
      result = result.map(function (resultelement) {
        if ((resultelement instanceof CSG) || (resultelement instanceof CAG)) {
          resultelement = { data: resultelement };
        }
        return resultelement;
      });
    }
    return result;
  };

  // check whether the supplied script returns valid object(s)
  static checkResult(result) {
    var ok = true;
    if (typeof (result) != "object") {
      ok = false;
    }
    else {
      if (result instanceof Array) {
        if (result.length < 1) {
          ok = false;
        }
        else {
          result.forEach(function (resultelement) {
            if (!("data" in resultelement)) {
              ok = false;
            }
            else {
              if ((resultelement.data instanceof CSG) || (resultelement.data instanceof CAG)) {
                // ok
              }
              else {
                ok = false;
              }
            }
          });
        }

      }
      else if ((result instanceof CSG) || (result instanceof CAG)) {
      }
      else {
        ok = false;
      }
    }
    if (!ok) {
      throw new Error("Your main() function does not return valid data. It should return one of the following: a CSG object, a CAG object, an array of CSG/CAG objects, or an array of objects: [{name:, caption:, data:}, ...] where data contains a CSG or CAG object.");
    }
  };

  // convert the result to a compact binary representation, to be copied from the webworker to the main thread.
  // it is assumed that checkResult() has been called already so the data is valid.
  static resultToCompactBinary(resultin) {
    var resultout;
    if (resultin instanceof Array) {
      resultout = resultin.map(function (resultelement) {
        var r = resultelement;
        r.data = resultelement.data.toCompactBinary();
        return r;
      });
    }
    else {
      resultout = resultin.toCompactBinary();
    }
    return resultout;
  };

  static resultFromCompactBinary(resultin) {
    function fromCompactBinary(r) {
      var result;
      if (r.class == "CSG") {
        result = CSG.fromCompactBinary(r);
      }
      else if (r.class == "CAG") {
        result = CAG.fromCompactBinary(r);
      }
      else {
        throw new Error("Cannot parse result");
      }
      return result;
    }
    var resultout;
    if (resultin instanceof Array) {
      resultout = resultin.map(function (resultelement) {
        var r = resultelement;
        r.data = fromCompactBinary(resultelement.data);
        return r;
      });
    }
    else {
      resultout = fromCompactBinary(resultin);
    }
    return resultout;
  };


  static parseJsCadScriptSync(script, mainParameters, debugging) {
    var workerscript = "";
    workerscript += script;
    if (debugging) {
      workerscript += "\n\n\n\n\n\n\n/* -------------------------------------------------------------------------\n";
      workerscript += "OpenJsCad debugging\n\nAssuming you are running Chrome:\nF10 steps over an instruction\nF11 steps into an instruction\n";
      workerscript += "F8  continues running\nPress the (||) button at the bottom to enable pausing whenever an error occurs\n";
      workerscript += "Click on a line number to set or clear a breakpoint\n";
      workerscript += "For more information see: http://code.google.com/chrome/devtools/docs/overview.html\n\n";
      workerscript += "------------------------------------------------------------------------- */\n";
      workerscript += "\n\n// Now press F11 twice to enter your main() function:\n\n";
      workerscript += "debugger;\n";
    }
    workerscript += "return main(" + JSON.stringify(mainParameters) + ");";
    var f = new Function(workerscript);
    var result = f();
    result = OpenJsCad.expandResultObjectArray(result);
    OpenJsCad.checkResult(result);
    return result;
  };

  // callback: should be function(error, csg)
  static parseJsCadScriptASync(script, mainParameters, options, callback) {
    var baselibraries = [
      "src/csg.js",
      "src/openjscad.js"
    ];

    var baseurl = document.location.href.replace(/\?.*$/, '');
    var openjscadurl = baseurl;
    if (typeof options['openJsCadPath'] != 'undefined') {
      // trailing '/' indicates it is a folder. This is necessary because makeAbsoluteUrl is called
      // on openjscadurl
      openjscadurl = OpenJsCad.makeAbsoluteUrl(options['openJsCadPath'], baseurl) + '/';
    }

    var libraries = [];
    if (typeof options['libraries'] != 'undefined') {
      libraries = options['libraries'];
    }

    var workerscript = "";
    workerscript += script;
    workerscript += "\n\n\n\n//// The following code is added by OpenJsCad:\n";
    workerscript += "var _csg_baselibraries=" + JSON.stringify(baselibraries) + ";\n";
    workerscript += "var _csg_libraries=" + JSON.stringify(libraries) + ";\n";
    workerscript += "var _csg_baseurl=" + JSON.stringify(baseurl) + ";\n";
    workerscript += "var _csg_openjscadurl=" + JSON.stringify(openjscadurl) + ";\n";
    workerscript += "var _csg_makeAbsoluteURL=" + OpenJsCad.makeAbsoluteUrl.toString() + ";\n";
    workerscript += "_csg_baselibraries = _csg_baselibraries.map(function(l){return _csg_makeAbsoluteURL(l,_csg_openjscadurl);});\n";
    workerscript += "_csg_libraries = _csg_libraries.map(function(l){return _csg_makeAbsoluteURL(l,_csg_baseurl);});\n";
    workerscript += "_csg_baselibraries.map(function(l){importScripts(l)});\n";
    workerscript += "_csg_libraries.map(function(l){importScripts(l)});\n";
    workerscript += "self.addEventListener('message', function(e) {if(e.data && e.data.cmd == 'render'){";
    workerscript += "  OpenJsCad.runMainInWorker(" + JSON.stringify(mainParameters) + ");";
    workerscript += "}},false);\n";
    console.log(workerscript);
    var blobURL = OpenJsCad.textToBlobUrl(workerscript);

    if (!window["Worker"]) throw new Error("Your browser doesn't support Web Workers. Please try the Chrome browser instead.");
    var worker = new Worker(blobURL);
    worker.onmessage = function (e) {
      if (e.data) {
        if (e.data.cmd == 'rendered') {
          var resulttype = e.data.result.class;
          var result = OpenJsCad.resultFromCompactBinary(e.data.result);
          callback(null, result);
        }
        else if (e.data.cmd == "error") {
          callback(e.data.err, null);
        }
        else if (e.data.cmd == "log") {
          console.log(e.data.txt);
        }
      }
    };
    worker.onerror = function (e) {
      var errtxt = "Error in line " + e.lineno + ": " + e.message;
      callback(errtxt, null);
      console.error(e);
    };
    worker.postMessage({
      cmd: "render"
    }); // Start the worker.
    return worker;
  };

  static getWindowURL() {
    if (window.URL) return window.URL;
    else if (window["webkitURL"]) return window["webkitURL"];
    else throw new Error("Your browser doesn't support window.URL");
  };

  static textToBlobUrl(txt) {
    var windowURL = OpenJsCad.getWindowURL();
    var blob = new Blob([txt], { type: 'application/javascript' });
    var blobURL = windowURL.createObjectURL(blob);
    if (!blobURL) throw new Error("createObjectURL() failed");
    return blobURL;
  };

  static revokeBlobUrl(url) {
    if (window.URL) window.URL.revokeObjectURL(url);
    else if (window["webkitURL"]) window["webkitURL"].revokeObjectURL(url);
    else throw new Error("Your browser doesn't support window.URL");
  };

  static FileSystemApiErrorHandler(fileError, operation) {
    var errormap = {
      1: 'NOT_FOUND_ERR',
      2: 'SECURITY_ERR',
      3: 'ABORT_ERR',
      4: 'NOT_READABLE_ERR',
      5: 'ENCODING_ERR',
      6: 'NO_MODIFICATION_ALLOWED_ERR',
      7: 'INVALID_STATE_ERR',
      8: 'SYNTAX_ERR',
      9: 'INVALID_MODIFICATION_ERR',
      10: 'QUOTA_EXCEEDED_ERR',
      11: 'TYPE_MISMATCH_ERR',
      12: 'PATH_EXISTS_ERR',
    };
    var errname;
    if (fileError.code in errormap) {
      errname = errormap[fileError.code];
    }
    else {
      errname = "Error #" + fileError.code;
    }
    var errtxt = "FileSystem API error: " + operation + " returned error " + errname;
    throw new Error(errtxt);
  };

  static AlertUserOfUncaughtExceptions() {
    window.onerror = (message, url, line) => {
      message = message.toString().replace(/^Uncaught /i, "");
      alert(message + "\n\n(" + url + " line " + line + ")");
    };
  };

  // parse the jscad script to get the parameter definitions
  static getParamDefinitions(script) {
    var scriptisvalid = true;
    try {
      // first try to execute the script itself
      // this will catch any syntax errors
      var f = new Function(script);
      f();
    }
    catch (e) {
      scriptisvalid = false;
    }
    var params = [];
    if (scriptisvalid) {
      var script1 = "if(typeof(getParameterDefinitions) == 'function') {return getParameterDefinitions();} else {return [];} ";
      script1 += script;
      var f = new Function(script1);
      params = f();
      if ((typeof (params) != "object") || (typeof (params.length) != "number")) {
        throw new Error("The getParameterDefinitions() function should return an array with the parameter definitions");
      }
    }
    return params;
  };
}
