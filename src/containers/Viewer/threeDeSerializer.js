/**
 * @author aleeper / http://adamleeper.com/
 * @author mrdoob / http://mrdoob.com/
 * @author gero3 / https://github.com/gero3
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A THREE loader for STL ASCII files, as created by Solidworks and other CAD programs.
 *
 * Supports both binary and ASCII encoded files, with automatic detection of type.
 *
 * The loader returns a non-indexed buffer geometry.
 *
 * Limitations:
 *  Binary decoding supports "Magics" color format (http://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL).
 *  There is perhaps some question as to how valid it is to always assume little-endian-ness.
 *  ASCII decoding assumes file is UTF-8.
 *
 * Usage:
 *  var loader = new THREE.STLLoader();
 *  loader.load( './models/stl/slotted_disk.stl', function ( geometry ) {
 *    scene.add( new THREE.Mesh( geometry ) );
 *  });
 *
 * For binary STLs geometry might contain colors for vertices. To use it:
 *  // use the same code to load STL as above
 *  if (geometry.hasColors) {
 *    material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors });
 *  } else { .... }
 *  var mesh = new THREE.Mesh( geometry, material );
 */
const {
    CSG
} = require('@jscad/csg')
module.exports = function (THREE) {

    var STLLoader = function (manager) {

        this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

    };

    STLLoader.prototype = {

        constructor: THREE.STLLoader,

        load: function (url, onLoad, onProgress, onError) {

            var scope = this;

            var loader = new THREE.FileLoader(scope.manager);
            loader.setResponseType('arraybuffer');
            loader.load(url, function (text) {

                onLoad(scope.parse(text));

            }, onProgress, onError);

        },

        parse: function (data) {

            var isBinary = function () {

                var expect, face_size, n_faces, reader;
                reader = new DataView(binData);
                face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
                n_faces = reader.getUint32(80, true);
                expect = 80 + (32 / 8) + (n_faces * face_size);

                if (expect === reader.byteLength) {

                    return true;

                }

                // An ASCII STL data must begin with 'solid ' as the first six bytes.
                // However, ASCII STLs lacking the SPACE after the 'd' are known to be
                // plentiful.  So, check the first 5 bytes for 'solid'.

                // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'
                var solid = [115, 111, 108, 105, 100];

                for (var i = 0; i < 5; i++) {

                    // If solid[ i ] does not match the i-th byte, then it is not an
                    // ASCII STL; hence, it is binary and return true.

                    if (solid[i] != reader.getUint8(i, false)) return true;

                }

                // First 5 bytes read "solid"; declare it to be an ASCII STL
                return false;

            };

            function toBinary(input) {
                var result = "";
                for (var i = 0; i < input.length; i++) {
                    var bin = input[i].charCodeAt().toString(2);
                    result += Array(8 - bin.length + 1).join("0") + bin;
                }
                return result;
            }
            var binData = this.ensureBinary(data);
            return isBinary() ? this.parseBinary(binData) : this.parseASCII(this.ensureString(data));

        },

        parseBinary: function (data) {

            var reader = new DataView(data);

            var faces = reader.getUint32(80, true);

            var r, g, b, hasColors = false,
                colors;
            var defaultR, defaultG, defaultB, alpha;

            // process STL header
            // check for default color in header ("COLOR=rgba" sequence).

            for (var index = 0; index < 80 - 10; index++) {

                if ((reader.getUint32(index, false) == 0x434F4C4F /*COLO*/ ) &&
                    (reader.getUint8(index + 4) == 0x52 /*'R'*/ ) &&
                    (reader.getUint8(index + 5) == 0x3D /*'='*/ )) {

                    hasColors = true;
                    colors = [];

                    defaultR = reader.getUint8(index + 6) / 255;
                    defaultG = reader.getUint8(index + 7) / 255;
                    defaultB = reader.getUint8(index + 8) / 255;
                    alpha = reader.getUint8(index + 9) / 255;

                }

            }

            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;

            var geometry = new THREE.BufferGeometry();

            var verticesCad = [];
            var verticesCad2 = {};
            var trianglesCad = [];

            for (var face = 0; face < faces; face++) {

                var start = dataOffset + face * faceLength;



                var triangle = [];
                var toFixed = 1;
                let no = [];
                no.push(reader.getFloat32(start, true));
                no.push(reader.getFloat32(start + 4, true));
                no.push(reader.getFloat32(start + 8, true));

                let v1p = [];
                let v2p = [];

                for (var i = 1; i <= 3; i++) {

                    var vertexstart = start + i * 12;
                    let v1 = reader.getFloat32(vertexstart, true);
                    let v2 = reader.getFloat32(vertexstart + 4, true);
                    let v3 = reader.getFloat32(vertexstart + 8, true);
                    v1p.push([v1.toFixed(toFixed), v2.toFixed(toFixed), v3.toFixed(toFixed)]);
                    v2p.push([v1, v2, v3]);
                }

                let w1 = new CSG.Vector3D(v2p[0])
                let w2 = new CSG.Vector3D(v2p[1])
                let w3 = new CSG.Vector3D(v2p[2])
                let e1 = w2.minus(w1)
                let e2 = w3.minus(w1)
                let t = new CSG.Vector3D(no).dot(e1.cross(e2))
                if (t > 0) { // 1,2,3 -> 3,2,1
                    let tmp = v1p[2]
                    v1p[2] = v1p[0]
                    v1p[0] = tmp
                }

                for (var i = 0; i < 3; i++) {
                    var vert = v1p[i].toString();
                    var index = verticesCad2[vert];
                    if (index == undefined) {
                        triangle.push(verticesCad.length);
                        verticesCad2[vert] = verticesCad.length;
                        verticesCad.push(vert);
                    } else {
                        triangle.push(index);
                    }
                }

                trianglesCad.push(triangle);

            }

            if (hasColors) {

                geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
                geometry.hasColors = true;
                geometry.alpha = alpha;

            }
            verticesCad2 = undefined;
            return {
                verticesCad,
                trianglesCad
            };

        },

        parseASCII: function (data) {

            var geometry, length, patternFace, patternNormal, patternVertex, result, text;
            geometry = new THREE.BufferGeometry();
            patternFace = /facet([\s\S]*?)endfacet/g;

            var vertices = [];
            var normals = [];

            var normal = new THREE.Vector3();

            while ((result = patternFace.exec(data)) !== null) {

                text = result[0];
                patternNormal = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;

                while ((result = patternNormal.exec(text)) !== null) {

                    normal.x = parseFloat(result[1]);
                    normal.y = parseFloat(result[3]);
                    normal.z = parseFloat(result[5]);

                }

                patternVertex = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;

                while ((result = patternVertex.exec(text)) !== null) {

                    vertices.push(parseFloat(result[1]), parseFloat(result[3]), parseFloat(result[5]));
                    normals.push(normal.x, normal.y, normal.z);

                }

            }

            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));

            return geometry;

        },

        ensureString: function (buf) {

            if (typeof buf !== "string") {

                var array_buffer = new Uint8Array(buf);
                var strArray = [];
                for (var i = 0; i < buf.byteLength; i++) {

                    strArray.push(String.fromCharCode(array_buffer[i])); // implicitly assumes little-endian

                }
                return strArray.join('');

            } else {

                return buf;

            }

        },

        ensureBinary: function (buf) {

            if (typeof buf === "string") {

                var array_buffer = new Uint8Array(buf.length);
                for (var i = 0; i < buf.length; i++) {

                    array_buffer[i] = buf.charCodeAt(i) & 0xff; // implicitly assumes little-endian

                }
                return array_buffer.buffer || array_buffer;

            } else {

                return buf;

            }

        }

    }

    return STLLoader
}