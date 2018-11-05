import { CSG } from '@jscad/csg';
// import { CSG } from './CSG.js';

export class STLLoader {
    constructor() { }

    private isBinary(binData) {
        let expect, face_size, n_faces, reader;
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
        const solid = [115, 111, 108, 105, 100];

        for (let i = 0; i < 5; i++) {
            // If solid[ i ] does not match the i-th byte, then it is not an
            // ASCII STL; hence, it is binary and return true.
            if (solid[i] != reader.getUint8(i, false))
                return true;
        }
        // First 5 bytes read "solid"; declare it to be an ASCII STL
        return false;
    }

    private ensureBinary(buf) {
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

    private convert(buffer) {
        let binary = ''
        const bytes = new Uint8Array(buffer)
        let length = bytes.byteLength
        for (let i = 0; i < length; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return binary
    }

    public async load(blob) {
        return await new Promise((resolve, reject) => {
            try {
                const fileReader: FileReader = new FileReader();
                fileReader.onloadend = (ev) => {
                    if (fileReader.result) {
                        const stlContent = this.parse(this.convert(fileReader.result));
                        resolve(stlContent);
                    } else {
                        resolve(null);
                    }
                };
                fileReader.readAsArrayBuffer(blob);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    public async parse(data) {
        return await new Promise((resolve, reject) => {
            try {
                const binData = this.ensureBinary(data);
                resolve(this.isBinary(binData) ? this.parseBinary(binData) : null);
            } catch (ex) {
                reject(ex);
            }
        });
    }

    public parseBinary(data) {
        const reader = new DataView(data);
        const faces = reader.getUint32(80, true);
        const dataOffset = 84;
        const faceLength = 12 * 4 + 2;
        const verticesCad = [];
        let verticesCad2 = {};
        const trianglesCad = [];

        for (var face = 0; face < faces; face++) {
            const start = dataOffset + face * faceLength;
            const triangle = [];
            const toFixed = 1;
            let no = [];
            let v1p = [];
            let v2p = [];

            no.push(reader.getFloat32(start, true));
            no.push(reader.getFloat32(start + 4, true));
            no.push(reader.getFloat32(start + 8, true));

            for (var i = 1; i <= 3; i++) {

                const vertexstart = start + i * 12;
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
                const vert = v1p[i].toString();
                const index = verticesCad2[vert];
                if (index == undefined) {
                    triangle.push(verticesCad.length);
                    verticesCad2[vert] = verticesCad.length;
                    verticesCad.push(v1p[i]);
                } else {
                    triangle.push(index);
                }
            }
            trianglesCad.push(triangle);
        }

        verticesCad2 = undefined;
        return {
            points: verticesCad,
            polygons: trianglesCad
        };

    }
}

