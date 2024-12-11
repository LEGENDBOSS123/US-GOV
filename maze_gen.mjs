import * as THREE from "three";
import Box from "./3D/Physics/Shapes/Box.mjs";
import Composite from "./3D/Physics/Shapes/Composite.mjs";
import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
import Quaternion from "./3D/Physics/Math3D/Quaternion.mjs";

var endpoints = new Set();

var isCloseToAnyEndpoint = function (pos) {
    for (var i of endpoints) {
        if (pos.distance(JSON.parse(i)) < 50) {
            return true;
        }
    }
    return false;
}

var node = class {
    constructor(depth, parent) {
        this.parent = parent;
        this.middle = null;
        this.left = null;
        this.right = null;
        this.paths = 1;
        this.correctPath = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
        this.position = new Vector3(0, 0, 0);
        this.direction = new Vector3(150, 0, 0);
        

        this.angleRotate = 90;
        this.depth = depth;
    }

    color(){
        this.color = null;
        while(true){
            this.color = ["green", "red", "blue", "yellow"][Math.floor(Math.random() * 4)];
            if((this.color == this.parent?.color) + (this.color == this.parent?.left?.color) + (this.color == this.parent?.middle?.color) + (this.color == this.parent?.right?.color) <= 1){
                break;
            }
        }
        this.left?.color();
        this.middle?.color();
        this.right?.color();
    }

    intersections(callback, winCallback){
        if(this.end){
            winCallback(this.position.add(this.direction), this);
        }
        if((this.left != null) + (this.middle != null) + (this.right != null) > 1){
            callback(this.position.add(this.direction), this);
        }
        this.left?.intersections(...arguments);
        this.middle?.intersections(...arguments);
        this.right?.intersections(...arguments);
    }

    split(){
        if(this.depth > 0){
            if(this.correctPath == null){
                var i = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                var path = this.createNewPath(i);
                if(isCloseToAnyEndpoint(path.position.add(path.direction))){
                    this[i] = null;
                }
                endpoints.add(JSON.stringify(path.position.add(path.direction).toJSON()));
                path.correctPath = null;
            }
            else{
                var correctPath = this.createNewPath(this.correctPath);

                if(isCloseToAnyEndpoint(correctPath.position.add(correctPath.direction))){
                    this[this.correctPath] = null;
                    if(this.parent){
                        this.parent.correctPath = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                    this.parent.left = this.parent.right = this.parent.middle = null;
                    this.parent.depth--;
                    return this.parent.split();
                    }
                    
                }
                endpoints.add(JSON.stringify(correctPath.position.add(correctPath.direction).toJSON()));

            }
            this.left?.split();
            this.middle?.split();
            this.right?.split();
        }
        else{
            this.end = true;
        }
    }

    createNewPath(where){
        var scaleFactor = 1;
        switch(where){
            case "left":
                this.left = new node(this.depth - 1, this);
                this.left.position = this.position.add(this.direction);
                this.left.direction = this.direction.applyAxisAngle(new Vector3(0, 1, 0), -this.angleRotate * Math.PI / 180).scale(scaleFactor);
                
                return this.left;
            case "middle":
                this.middle = new node(this.depth - 1, this);
                this.middle.position = this.position.add(this.direction);
                this.middle.direction = this.direction.copy().scale(scaleFactor);
                return this.middle;
            case "right":
                this.right = new node(this.depth - 1, this);
                this.right.position = this.position.add(this.direction);
                this.right.direction = this.direction.applyAxisAngle(new Vector3(0, 1, 0), this.angleRotate * Math.PI / 180).scale(scaleFactor);
                return this.right;
        }
    }

    addFakes(){
        if(this.depth > 0){
            if(this.correctPath == null){
                var i = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                var path = this.createNewPath(i);
                if(isCloseToAnyEndpoint(path.position.add(path.direction))){
                    this[i] = null;
                }
                else{
                    endpoints.add(JSON.stringify(path.position.add(path.direction).toJSON()));
                    path.correctPath = null;
                    //return this[i].addFakes();
                }
            }
            else{
                var randomPath = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                console.log("e")
                if(randomPath != this.correctPath){
                    
                    var path = this.createNewPath(randomPath);
                    if(isCloseToAnyEndpoint(path.position.add(path.direction))){
                        this[randomPath] = null;
                    }
                    else{
                        path.correctPath = null;
                        path.depth = Math.floor(Math.random() * 3) + 1;
                        endpoints.add(JSON.stringify(path.position.add(path.direction).toJSON()));
                    }
                }
            }
            this.left?.addFakes();
            this.middle?.addFakes();
            this.right?.addFakes();
        }
    }
}




class maze_gen {
    constructor(graphicsEngine, world) {
        this.graphicsEngine = graphicsEngine;
        this.world = world;
        this.map = this.graphicsEngine.textureLoader.load("3D/Graphics/Textures/rockyGround.jpg");
        this.map.wrapS = this.map.wrapT = THREE.RepeatWrapping;
        this.map.repeat.set(5, 5);
        this.winMap = this.graphicsEngine.textureLoader.load("3D/Graphics/Textures/checkerboard.jpg");
        this.winMap.wrapS = this.winMap.wrapT = THREE.RepeatWrapping;
        this.winMap.repeat.set(1, 3);
        this.height = 100;
        endpoints = new Set([JSON.stringify(new Vector3().toJSON())]);
        this.head = new node(30);
        this.head.split();

        while(this.head.left == null && this.head.right == null && this.head.middle == null){
            endpoints = new Set([JSON.stringify(new Vector3().toJSON())]);
            this.head = new node(30);
            this.head.split();
        }
        this.head.addFakes();
        this.head.color();
        this.head.intersections(this.createIntersection.bind(this), this.createWin.bind(this));
        top.maze = this;
        
    }

    createFloor(player) {
        var box = new Box({
            width: 5000,
            height: 30,
            depth: 5000,
            local: {
                body: {
                    mass: Infinity,
                }
            },
            global: {
                body: {
                    position: new Vector3(0, -15, 0)
                }
            }
        });
        var map = this.graphicsEngine.textureLoader.load("3D/Graphics/Textures/lava.jpg");
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(30, 30);
        box.setMesh({
            material: new THREE.MeshPhongMaterial({
                map: map,
            })
        }, THREE);
        box.setRestitution(0);
        box.preCollisionCallback = function (contact) {
            
            if (contact.body1.maxParent == player || contact.body2.maxParent == player) {
                player.respawn();
            }
        }
        box.setFriction(0);
        box.mesh.castShadow = true;
        box.mesh.receiveShadow = true;
        box.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.world.addComposite(box);
        this.graphicsEngine.addToScene(box.mesh);
    }
    createIntersection(pos, node){
        pos.y += this.height/2;
        var box = new Box({
            width:  10 + Math.random(),
            height: 4,
            depth: 10 + Math.random(),
            local: {
                body: {
                    mass: Infinity,
                }
            },
            global: {
                body: {
                    position: pos
                }
            }
        });
        box.setMesh({
            material: new THREE.MeshPhongMaterial({
                color: "white"
            })
        }, THREE);
        box.preCollisionCallback = function (contact) {
            if (contact.body1.maxParent == player || contact.body2.maxParent == player) {
                if(node.correctPath == null){
                    console.log(node.color)
                }
                else{
                    console.log(node[node.correctPath].color)
                }
            }
        }
        box.setRestitution(0);
        box.setFriction(0);
        box.mesh.castShadow = true;
        box.mesh.receiveShadow = true;
        
        box.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.world.addComposite(box);
        this.graphicsEngine.addToScene(box.mesh);
    }
    createWin(pos, node){
        pos.y += this.height/2;
        var box = new Box({
            width:  10 + Math.random(),
            height: 30,
            depth: 10 + Math.random(),
            local: {
                body: {
                    mass: Infinity,
                }
            },
            global: {
                body: {
                    position: pos
                }
            }
        });
        box.setMesh({
            material: new THREE.MeshPhongMaterial({
                map: this.winMap
            })
        }, THREE);
        box.preCollisionCallback = function (contact) {
            if (contact.body1.maxParent == player || contact.body2.maxParent == player) {
                alert("you win");
            }
        }
        box.setRestitution(0);
        box.setFriction(0);
        box.mesh.castShadow = true;
        box.mesh.receiveShadow = true;
        
        box.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.world.addComposite(box);
        this.graphicsEngine.addToScene(box.mesh);
    }
    createSphereAtPos(pos, rad) {
        var sphereMesh = new THREE.Mesh(
            new THREE.SphereGeometry(rad, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        );
        sphereMesh.position.set(pos.x, pos.y, pos.z);
        sphereMesh.castShadow = true;
        sphereMesh.receiveShadow = true;
        this.graphicsEngine.addToScene(sphereMesh);
    }
    createNode(node = this.head) {
        if(node == null){
            return;
        }
        var start = node.position;
        var end = node.direction.add(start);
        // this.createSphereAtPos(start, 5);
        // this.createSphereAtPos(end, 5);

        var direction = end.subtract(start);
        var normDir = direction.normalize();
        var quat = Quaternion.lookAt(normDir, new Vector3(0, 1, 0));
        var box = new Box({
            width:  10 + Math.random(),
            height: this.height + Math.random(),
            depth: direction.magnitude() + 10,
            local: {
                body: {
                    mass: Infinity,
                }
            },
            global: {
                body: {
                    position: new Vector3((start.x + end.x) / 2, (start.y + end.y)/2, (start.z + end.z) / 2),
                    rotation: quat
                }
            }
        });
        
        box.setMesh({
            material: new THREE.MeshPhongMaterial({
                color: node.color
            })
        }, THREE);
        box.setRestitution(0);
        box.setFriction(0);
        box.mesh.castShadow = true;
        box.mesh.receiveShadow = true;
        
        box.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.world.addComposite(box);
        this.graphicsEngine.addToScene(box.mesh);

        this.createNode(node.left);
        this.createNode(node.right);
        this.createNode(node.middle);
    }
}

export default maze_gen;