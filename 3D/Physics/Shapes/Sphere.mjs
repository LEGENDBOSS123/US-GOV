import Composite from "./Composite.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";

var Sphere = class extends Composite {
    constructor(options) {
        super(options);
        this.shape = this.constructor.SHAPES.SPHERE;
        this.radius = options?.radius ?? 1;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.calculateLocalHitbox();
        this.calculateGlobalHitbox();
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(-this.radius, -this.radius, -this.radius);
        this.local.hitbox.max = new Vector3(this.radius, this.radius, this.radius);
        return this.hitbox;
    }

    calculateGlobalHitbox() {
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        var I = (2/5) * this.local.body.mass * this.radius * this.radius;
        this.local.body.momentOfInertia.set(0, 0, I);
        this.local.body.momentOfInertia.set(1, 1, I);
        this.local.body.momentOfInertia.set(2, 2, I);
        return this.local.body.momentOfInertia;
    }

    setMesh(options, THREE){
        var geometry = options?.geometry ?? new THREE.SphereGeometry(this.radius, 32, 32);
        this.setColorGeometry(geometry, THREE);
        this.mesh = new THREE.Mesh(geometry, options?.material ?? new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true }));
        this.updateMesh();
    }
};

export default Sphere;