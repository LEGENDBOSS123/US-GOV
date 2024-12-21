import SpatialHash from "../Broadphase/SpatialHash.mjs";
import CollisionDetector from "../Collision/CollisionDetector.mjs";
import Composite from "../Shapes/Composite.mjs";

var World = class {
    constructor(options) {
        this.maxID = options?.maxID ?? 0;
        this.deltaTime = options?.deltaTime ?? 1;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;

        this.iterations = options?.iterations ?? 1;

        this.all = options?.all ?? {};

        this.composites = options?.composites ?? [];
        this.spatialHash = options?.spatialHash ?? new SpatialHash({ world: this });
        this.collisionDetector = options?.collisionDetector ?? new CollisionDetector({ world: this });
    }

    setDeltaTime(deltaTime) {
        this.deltaTime = deltaTime;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;
    }

    setIterations(iterations) {
        this.iterations = iterations;
        this.setDeltaTime(1 / this.iterations);
    }

    addComposite(composite) {
        this.add(composite);
        this.composites.push(composite);
    }

    add(element) {
        element.id = (this.maxID++);
        element.setWorld(this);
        this.all[element.id] = element;
        return element;
    }

    updateBeforeCollisionAll() {
        for (var i = 0; i < this.composites.length; i++) {
            if (this.composites[i].isMaxParent()) {
                this.composites[i].updateBeforeCollisionAll();
            }
        }
    }

    updateAfterCollisionAll() {
        for (var i = 0; i < this.composites.length; i++) {
            if (this.composites[i].isMaxParent()) {
                this.composites[i].updateAfterCollisionAll();
            }
        }
    }

    step() {
        for (var i = 0; i < this.iterations; i++) {
            this.updateBeforeCollisionAll();
            this.collisionDetector.handleAll(this.composites);
            this.collisionDetector.resolveAll();
            this.updateAfterCollisionAll();
        }
    }

    getByID(id) {
        return this.all[id];
    }

    toJSON(){
        var world = {};

        world.maxID = this.maxID;
        world.deltaTime = this.deltaTime;
        world.deltaTimeSquared = this.deltaTimeSquared;
        world.inverseDeltaTime = this.inverseDeltaTime;
        world.iterations = this.iterations;
        world.all = [];

        for (var i in this.all) {
            world.all.push(this.getByID(i).toJSON());
        }

        world.composites = [];
        for (var i = 0; i < this.composites.length; i++) {
            world.composites.push(this.composites[i].id);
        }

        world.spatialHash = this.spatialHash.toJSON();
        world.collisionDetector = this.collisionDetector.toJSON();

        return world;
    }

    static fromJSON(json){
        var world = new this();

        world.maxID = json.maxID;
        world.deltaTime = json.deltaTime;
        world.deltaTimeSquared = json.deltaTimeSquared;
        world.inverseDeltaTime = json.inverseDeltaTime;
        world.iterations = json.iterations;
        world.all = {};

        for (var i in json.all) {
            world.all[i] = Composite.SHAPES_CLASSES[json.all[i].shape].fromJSON(json.all[i], world);
        }

        for (var i in world.all) {
            console.log(world.all[i].maxParent);
            world.all[i].updateIDsFromJSON(world);
        }

        world.composites = [];
        for (var i in json.composites) {
            world.composites.push(world.getByID(json.composites[i]));
        }

        world.spatialHash = SpatialHash.fromJSON(json.spatialHash, world);
        world.collisionDetector = CollisionDetector.fromJSON(json.collisionDetector, world);
        return world;
    }
};


export default World;