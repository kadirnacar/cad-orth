import * as THREE from 'three';
import * as THREEOrbitControls from 'three-orbit-controls';
// import * as THREESTLLoader from 'three-stl-loader';
import { STLLoader } from './STLFileLoader';
// import * as THREECSG from 'three-js-csg';
import * as THREECSG from './bCSG';
// var STLLoader = new THREESTLLoader(THREE);
var OrbitControls = new THREEOrbitControls(THREE);
import * as  THREEThreeBSP from './THREECSG';
var ThreeBSP = THREEThreeBSP(THREE);
export default class Renderer {
    constructor(canvas: HTMLCanvasElement) {
        console.log(ThreeBSP,THREEThreeBSP);
        const engine = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        engine.setClearColor(0x999999)
        engine.setPixelRatio(window.devicePixelRatio);
        engine.setSize(width, height);

        this.createScene(canvas, engine);

        window.addEventListener('resize', function () {
            engine.setSize(width, height);
        });
    }
    private _canvas: HTMLCanvasElement;
    private _engine: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _ground: THREE.GridHelper;
    private _controls: THREE.OrbitControls;
    private _currentMesh: BABYLON.AbstractMesh;
    private _startingPoint: BABYLON.Vector3;

    public createScene(canvas: HTMLCanvasElement, engine: THREE.WebGLRenderer) {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        this._canvas = canvas;
        this._engine = engine;
        this._scene = new THREE.Scene();
        this._scene.add(new THREE.AmbientLight(0x999999));
        this._camera = new THREE.PerspectiveCamera(
            50, width / height, 1, 2000
        )

        this._camera.up.set(0, 0, 2);
        this._camera.position.set(0, 0, 400);

        this._camera.add(new THREE.PointLight(0xffffff, 0.8));

        this._scene.add(this._camera);

        this._ground = new THREE.GridHelper(500, 50, 0xffffff, 0x555555);
        this._ground.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));
        this._scene.add(this._ground);

        this._controls = new OrbitControls(this._camera, this._engine.domElement);
        // this.controls.addEventListener('change', this.renderScene);
        this._controls.target.set(0, 1.2, 2);
        this._controls.update();
        this.renderScene();
    }

    renderScene = () => {
        requestAnimationFrame(this.renderScene);
        this._controls.update();
        this._engine.render(this._scene, this._camera);
    }

    public setRotate({ x, y, z }, index) {
        // this._scene.meshes[index].rotation.set(x / 57, y / 57, z / 57);
    }

    public setScale({ x, y, z }, index) {
        // this._scene.meshes[index].scaling.set(x, y, z);
    }

    public intersect(index1, index2) {

    }

    public Delete(index) {
        // this._scene.meshes[index].dispose();
    }

    public async loadStl(file: File) {
        return await new Promise((resolve, reject) => {
            try {
                const fileReader: FileReader = new FileReader();
                fileReader.onloadend = (ev) => {
                    if (fileReader.result) {
                        const loader = new STLLoader();
                        // loader.load(this._scene, fileReader.result, '');
                        // var mesh = this._scene.meshes[this._scene.meshes.length - 1];
                        // var a = mesh as BABYLON.Mesh;
                        // var b = BABYLON.Mesh.CreateBox("box", 250, this._scene);
                        // var aCSG = CSG.FromMesh(a);
                        // var bCSG = CSG.FromMesh(b);
                        // var subCSG = aCSG.intersect(bCSG);
                        // a.dispose();
                        // b.dispose();
                        // mesh = subCSG.toMesh("csg", new BABYLON.StandardMaterial("mat", this._scene), this._scene, false);
                        // var serializedMesh = BABYLON.SceneSerializer.SerializeMesh(mesh);
                        // console.log(serializedMesh);
                        var material = new THREE.MeshPhongMaterial({ color: 0x0e2045, specular: 0x111111, shininess: 200 });
                        var materialBox = new THREE.MeshPhongMaterial({ color: 0xff5555, specular: 0x111111, shininess: 200 });

                        loader.load(fileReader.result, (geometry: any) => {
                            var mesh = new THREE.Mesh(geometry, material);
                            mesh.position.set(0, 0, 0);
                            // this.mesh.scale.set(.02, .02, .02);
                            mesh.rotation.set(0, - 40 / 57, 0);
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            mesh.updateMatrix();
                            const box = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), materialBox);
                            var cmesh = THREECSG.ThreeCsg.toCSG(mesh, null, null);
                            // var vmesh = ThreeBSP(box);
                            this._scene.add(mesh);
                            this._scene.add(box);
                        });

                        resolve(1);
                    } else {
                        resolve(null);
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } catch (ex) {
                reject(ex);
            }
        });
    }
}

