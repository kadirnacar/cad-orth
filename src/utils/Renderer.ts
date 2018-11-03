import * as BABYLON from 'babylonjs';
import STLFileLoader from './STLFileLoader';
import { CSG } from './bCSG';

export default class Renderer {
    constructor(canvas: HTMLCanvasElement) {
        const engine = new BABYLON.Engine(canvas, true);
        this.createScene(canvas, engine);

        engine.runRenderLoop(() => {
            this._scene.render();
        });

        window.addEventListener('resize', function () {
            engine.resize();
        });
    }
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _ground: BABYLON.Mesh;
    private _currentMesh: BABYLON.AbstractMesh;
    private _startingPoint: BABYLON.Vector3;

    public createScene(canvas: HTMLCanvasElement, engine: BABYLON.Engine) {
        this._canvas = canvas;

        this._engine = engine;

        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);
        this._scene = scene;

        // This creates and positions a free camera (non-mesh)
        this._camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);

        // This targets the camera to scene origin
        this._camera.setPosition(new BABYLON.Vector3(500, 500, -500));

        // This attaches the camera to the canvas
        this._camera.attachControl(canvas, true);
        this._camera.onViewMatrixChangedObservable.add(() => {
            // console.log(this._camera.rotation, this._camera.position)
        });
        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        const size = 100;
        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        this._ground = BABYLON.Mesh.CreateGround("ground1", 500, 500, 0, scene);

        var axisX = BABYLON.Mesh.CreateLines("axisX", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = this.makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = this.makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = this.makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);


        canvas.onpointerdown = this.onPointerDown.bind(this);
        canvas.onpointerup = this.onPointerUp.bind(this);
        canvas.onpointermove = this.onPointerMove.bind(this);
        canvas.onwheel = this.onWheel.bind(this);
        scene.onDispose = function () {
            canvas.onpointerdown = null;
            canvas.onpointerup = null;
            canvas.onpointermove = null;
            canvas.onwheel = null;
        }
    }

    private makeTextPlane(text, color, size) {
        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, this._scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
        var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, this._scene, true);
        plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", this._scene);
        plane.material.backFaceCulling = false;
        plane.material["specularColor"] = new BABYLON.Color3(0, 0, 0);
        plane.material["diffuseTexture"] = dynamicTexture;
        return plane;
    }

    private getGroundPosition() {
        // Use a predicate to get position on the ground
        var pickinfo = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => {
            return true;//mesh == this._ground;
        });
        if (pickinfo.hit) {
            return pickinfo.pickedPoint;
        }

        return null;
    }

    private onPointerDown(evt: PointerEvent): EventListener {
        if (evt.button !== 0) {
            return;
        }

        // check if we are under a mesh
        var pickInfo = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => {
            return mesh !== this._ground;
        });
        if (pickInfo.hit) {
            this._currentMesh = pickInfo.pickedMesh;
            this._startingPoint = this.getGroundPosition();

            if (this._startingPoint) { // we need to disconnect camera from canvas
                setTimeout(() => {
                    this._scene.activeCamera.detachControl(this._canvas);
                }, 0);
            }
        }
    }

    private onPointerUp() {
        if (this._startingPoint) {
            this._scene.activeCamera.attachControl(this._canvas, true);
            this._startingPoint = null;
            return;
        }
    }
    private onWheel(evt: WheelEvent) {


        if (!this._startingPoint) {
            return;
        }

        var current = this.getGroundPosition();

        if (!current) {
            return;
        }
        evt.preventDefault();
        let currScale = this._currentMesh.scaling.x;
        if (evt.deltaY < 0) {
            currScale -= 0.05;
        } else {
            currScale += 0.05;
        }
        this._currentMesh.scaling.set(currScale, currScale, currScale);
    }

    private onPointerMove(evt: PointerEvent) {
        if (!this._startingPoint) {
            return;
        }

        var current = this.getGroundPosition();

        if (!current) {
            return;
        }

        var diff = current.subtract(this._startingPoint);

        if (!evt.ctrlKey) {
            diff.y = 0;
            this._currentMesh.moveWithCollisions(diff);
        } else {
            diff.x = 0;
            diff.z = 0;
            this._currentMesh.moveWithCollisions(diff);
        }
        this._startingPoint = current;

    }
    public setRotate({ x, y, z }, index) {
        this._scene.meshes[index].rotation.set(x / 57, y / 57, z / 57);
    }
    public setScale({ x, y, z }, index) {
        this._scene.meshes[index].scaling.set(x, y, z);
    }
    public intersect(index1, index2) {
        var a = this._scene.meshes[index1];
        var b = this._scene.meshes[index2];
        var aCSG = CSG.FromMesh(a as BABYLON.Mesh);
        var bCSG = CSG.FromMesh(b as BABYLON.Mesh);
        var subCSG = aCSG.intersect(bCSG);
        subCSG.toMesh("csg", new BABYLON.StandardMaterial("mat", this._scene), this._scene, false);
    }
    public Delete(index) {
        this._scene.meshes[index].dispose();
    }
    public async loadStl(file: File) {
        return await new Promise((resolve, reject) => {
            try {
                const fileReader: FileReader = new FileReader();
                fileReader.onloadend = (ev) => {
                    if (fileReader.result) {
                        const loader: STLFileLoader = new STLFileLoader();
                        loader.load(this._scene, fileReader.result, '');
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
                        resolve(this._scene.meshes.length - 1);
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

