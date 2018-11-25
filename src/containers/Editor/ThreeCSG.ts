import * as THREE from 'three';
import { CSG } from '@jscad/csg';
import { string } from 'prop-types';
// import { CSG, CAG } from '../../utils/CSG.js';

/*
    adapted from THREE.CSG
    @author Chandler Prall <chandler.prall@gmail.com> http://chandler.prallfamily.com

    Wrapper for Evan Wallace's CSG library (https://github.com/evanw/csg.js/)
    Provides CSG capabilities for Three.js models.

    Provided under the MIT License

*/
export class ThreeCSG {
    static fromCSG(csg, defaultColor) {

        var i, j, vertices, face,
            three_geometry = new THREE.Geometry(),
            polygons = csg.toPolygons();

        if (!CSG) {
            throw 'CSG library not loaded. Please get a copy from https://github.com/evanw/csg.js';
        }

        // dict of different THREE.Colors in mesh
        var colors = {};
        // list of different opacities used by polygons
        var opacities = [];
        var materialIdx, opacity, colorKey, polyColor, color;
        color = new THREE.Color("rgb("+  defaultColor.join(",")+")");

        polygons.forEach((polygon) => {
            // polygon shared null? -> defaultColor, else extract color
            var vertices = polygon.vertices.map((vertex) => {
                return this.getGeometryVertex(three_geometry, vertex.pos);
            }, this);

            if (vertices[0] === vertices[vertices.length - 1]) {
                vertices.pop();
            }

            polyColor = defaultColor.slice();
            opacity = polyColor.pop();

            // one material per opacity (color not relevant)
            // collect different opacity values in opacities
            // point to current polygon opacity with materialIdx
            var opacityIdx = opacities.indexOf(opacity);
            if (opacityIdx > -1) {
                materialIdx = opacityIdx;
            } else {
                opacities.push(opacity);
                materialIdx = opacities.length - 1;
            }

            // for each different color, create a color object

            // color.setRGB(defaultColor);


            // create a mesh face using color (not opacity~material)
            for (var k = 2; k < vertices.length; k++) {
                face = new THREE.Face3(vertices[0], vertices[k - 1], vertices[k],
                    new THREE.Vector3().copy(polygon.plane.normal),
                    color, materialIdx);
                face.materialIdx = materialIdx;
                three_geometry.faces.push(face);
            }
        }, this);

        // for each opacity in array, create a matching material
        // (color are on faces, not materials)
       
        // now, materials is array of materials matching opacities - color not defined yet
        var phongMaterial = new THREE.MeshPhongMaterial({
            // vertexColors: THREE.FaceColors,
            wireframe: false,
            color: color
        });
        var colorMesh = new THREE.Mesh(three_geometry, phongMaterial);

        // pass back bounding sphere radius (or 0 if empty object)
        three_geometry.computeBoundingSphere();
        var boundLen = three_geometry.boundingSphere.radius +
            three_geometry.boundingSphere.center.length() || 0;


        // return result;
        return {
            colorMesh: colorMesh,
            boundLen: boundLen
        };
    }

    static getGeometryVertex(geometry, vertex_position) {
        // var i;
        // // If Vertex already exists
        // // once required this should be done with the BSP info
        // for ( i = 0; i < geometry.vertices.length; i++ ) {
        //  if ( geometry.vertices[i].x === vertex_position.x &&
        //      geometry.vertices[i].y === vertex_position.y &&
        //      geometry.vertices[i].z === vertex_position.z ) {
        //      return i;
        //  }
        // }
        geometry.vertices.push(new THREE.Vector3(vertex_position.x, vertex_position.y, vertex_position.z));
        return geometry.vertices.length - 1;
    }
}
