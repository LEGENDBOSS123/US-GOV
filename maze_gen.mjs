import * as THREE from "three";
import Box from "./3D/Physics/Shapes/Box.mjs";
import Composite from "./3D/Physics/Shapes/Composite.mjs";
import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
import Quaternion from "./3D/Physics/Math3D/Quaternion.mjs";

var endpoints = new Set();

var questions = [
    { "question": "Which branch of the U.S. government is responsible for interpreting laws and ensuring they are fairly applied?", "answer": "Judicial Branch" },
    { "question": "Which branch of the U.S. government is responsible for making laws?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government is responsible for enforcing laws?", "answer": "Executive Branch" },
    { "question": "Which branch of the U.S. government can declare laws unconstitutional?", "answer": "Judicial Branch" },
    { "question": "Which branch of the U.S. government has the power to impeach officials?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government is led by the President?", "answer": "Executive Branch" },
    { "question": "Which branch of the U.S. government approves federal judges?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government interprets the meaning of laws?", "answer": "Judicial Branch" },
    { "question": "Which branch of the U.S. government can sign bills into law?", "answer": "Executive Branch" },
    { "question": "Which branch of the U.S. government has the power to write and pass bills?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government appoints Supreme Court justices?", "answer": "Executive Branch" },
    { "question": "Which branch of the U.S. government is composed of the Senate and the House of Representatives?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government conducts trials for federal cases?", "answer": "Judicial Branch" },
    { "question": "Which branch of the U.S. government has the power to negotiate treaties?", "answer": "Executive Branch" },
    { "question": "Which branch of the U.S. government can override a presidential veto?", "answer": "Legislative Branch" },
    { "question": "Which branch of the U.S. government ensures laws are enforced across the nation?", "answer": "Executive Branch" }
];


var shuffle = function (questions) {
    for (var i = questions.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = questions[i];
        questions[i] = questions[j];
        questions[j] = temp;
    }
    return questions;
}

var questionElement = null;

shuffle(questions);

var questionsNotTaken = new Set();
for (var i = 0; i < questions.length; i++) {
    questionsNotTaken.add(i);
}

var randomlySelectQuestion = function () {
    for (var i of questionsNotTaken) {
        var q = questions[i];
        questionsNotTaken.delete(i);
        return q;
    }
    return null;
}
var possible_answers = ["Judicial Branch", "Executive Branch", "Legislative Branch"];


var isCloseToAnyEndpoint = function (pos) {
    for (var i of endpoints) {
        if (pos.distance(JSON.parse(i)) < 20) {
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
        this.correctPath = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
        this.position = new Vector3(0, 0, 0);
        this.direction = new Vector3(150, 0, 0);


        this.angleRotate = 60;
        this.depth = depth;
    }

    color() {
        this.color = null;
        while (true) {
            this.color = ["green", "red", "blue", "yellow"][Math.floor(Math.random() * 4)];
            if ((this.color == this.parent?.color) + (this.color == this.parent?.left?.color) + (this.color == this.parent?.middle?.color) + (this.color == this.parent?.right?.color) <= 1) {
                break;
            }
        }
        this.left?.color();
        this.middle?.color();
        this.right?.color();
    }

    intersections(callback, winCallback) {
        if (this.end) {
            winCallback(this.position.add(this.direction), this);
        }
        if ((this.left != null) + (this.middle != null) + (this.right != null) > 1) {
            callback(this.position.add(this.direction), this);
        }
        this.left?.intersections(...arguments);
        this.middle?.intersections(...arguments);
        this.right?.intersections(...arguments);
    }

    split() {
        if (this.depth > 0) {
            if (this.correctPath == null) {
                var i = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                var path = this.createNewPath(i);
                if (isCloseToAnyEndpoint(path.position.add(path.direction))) {
                    this[i] = null;
                }
                endpoints.add(JSON.stringify(path.position.add(path.direction).toJSON()));
                path.correctPath = null;
            }
            else {
                var correctPath = this.createNewPath(this.correctPath);

                if (isCloseToAnyEndpoint(correctPath.position.add(correctPath.direction))) {
                    this[this.correctPath] = null;
                    if (this.parent) {
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
        else {
            this.end = true;
        }
    }

    createNewPath(where) {
        var scaleFactor = 1;
        switch (where) {
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

    addFakes() {
        if (this.depth > 0) {
            if (this.correctPath == null) {
                var i = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                var path = this.createNewPath(i);
                if (isCloseToAnyEndpoint(path.position.add(path.direction))) {
                    this[i] = null;
                }
                else {
                    endpoints.add(JSON.stringify(path.position.add(path.direction).toJSON()));
                    path.correctPath = null;
                    //return this[i].addFakes();
                }
            }
            else {
                var randomPath = ["left", "middle", "right"][Math.floor(Math.random() * 3)];
                if (randomPath != this.correctPath) {

                    var path = this.createNewPath(randomPath);
                    if (isCloseToAnyEndpoint(path.position.add(path.direction))) {
                        this[randomPath] = null;
                    }
                    else {
                        path.correctPath = null;
                        path.depth = Math.floor(Math.random() * 3) + 6;
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
    constructor(graphicsEngine, world, document) {
        this.document = document;
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
        this.head = new node(20);
        this.head.split();

        while (this.head.left == null && this.head.right == null && this.head.middle == null) {
            endpoints = new Set([JSON.stringify(new Vector3().toJSON())]);
            this.head = new node(20, null);
            this.head.split();
        }
        this.head.addFakes();
        this.head.color();
        this.head.intersections(this.createIntersection.bind(this), this.createWin.bind(this));
        top.maze = this;

    }

    createFloor(player) {
        var box = new Box({
            width: 15000,
            height: 50,
            depth: 15000,
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
    createIntersection(pos, node) {
        pos.y += this.height / 2;
        var box = new Box({
            width: 10 + Math.random(),
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
        var q = randomlySelectQuestion() || { "question": "Which branch rhymes with Eggs-execute ", "answer": "Executive Branch" }
        var wrong_answers = shuffle(possible_answers.filter(x => x != q.answer));
        var element = document.createElement("div");
        element.style.width = "600px";
        element.style.height = "400px";
        element.style.backgroundColor = "rgba(50, 50, 50, 0.9)";
        element.style.border = "4px solid black";
        element.style.top = "50%";
        element.style.left = "50%";
        element.style.transform = "translate(-50%, -50%)";
        element.style.pointerEvents = "none";
        element.style.position = "absolute";

        var questionContainer = this.document.createElement("div");
        questionContainer.style.position = "absolute";
        questionContainer.style.top = "5px";
        questionContainer.style.right = "50%";
        questionContainer.style.transform = "translate(50%)";
        questionContainer.style.width = "95%";
        questionContainer.style.height = "50%";
        questionContainer.style.fontSize = "30px";
        element.appendChild(questionContainer);

        var questionElem = document.createElement("div");
        questionElem.style.color = "white";
        questionElem.style.textAlign = "center";
        questionElem.style.top = "35px";
        questionElem.style.left = "50%";
        questionElem.style.transform = "translate(-50%)";
        questionElem.style.position = "absolute";
        questionElem.style.fontSize = "30px";
        questionElem.style.width = "95%";
        // player.global.body.setPosition(pos.add(new Vector3(0, 3, 0)));
        // player.spawnPoint = player.global.body.position.copy();
        // player.syncAll();
        questionElem.textContent = q.question;
        questionContainer.appendChild(questionElem);
        
        var answerContainer = this.document.createElement("div");
        answerContainer.style.position = "absolute";
        answerContainer.style.bottom = "5px";
        answerContainer.style.left = "50%";
        answerContainer.style.transform = "translate(-50%)";
        answerContainer.style.width = "95%";
        answerContainer.style.height = "45%";
        answerContainer.style.fontSize = "30px";
        answerContainer.style.display = "flex";
        answerContainer.style.flexDirection = "column";
        answerContainer.style.gap = "5px";
        element.appendChild(answerContainer);

        var answerElem1Container = document.createElement("div");
        answerElem1Container.style.position = "relative";
        answerElem1Container.style.left = "50%";
        answerElem1Container.style.transform = "translate(-50%)";
        answerElem1Container.style.width = "95%";
        answerElem1Container.style.height = "25%";
        answerElem1Container.style.fontSize = "30px";
        answerContainer.appendChild(answerElem1Container);

        var answerElem2Container = document.createElement("div");
        answerElem2Container.style.position = "relative";
        answerElem2Container.style.left = "50%";
        answerElem2Container.style.transform = "translate(-50%)";
        answerElem2Container.style.width = "95%";
        answerElem2Container.style.height = "25%";
        answerElem2Container.style.fontSize = "30px";
        answerContainer.appendChild(answerElem2Container);

        var answerElem3Container = document.createElement("div");
        answerElem3Container.style.position = "relative";
        answerElem3Container.style.left = "50%";
        answerElem3Container.style.transform = "translate(-50%)";
        answerElem3Container.style.width = "95%";
        answerElem3Container.style.height = "25%";
        answerElem3Container.style.fontSize = "30px";
        answerContainer.appendChild(answerElem3Container);

        var answerElem4Container = document.createElement("div");
        answerElem4Container.style.position = "relative";
        answerElem4Container.style.left = "50%";
        answerElem4Container.style.transform = "translate(-50%)";
        answerElem4Container.style.width = "95%";
        answerElem4Container.style.height = "25%";
        answerElem4Container.style.fontSize = "30px";
        answerContainer.appendChild(answerElem4Container);

        var answerElem1Box = document.createElement("div");
        answerElem1Box.style.position = "absolute";
        answerElem1Box.style.top = "50%";
        answerElem1Box.style.left = "10px";
        answerElem1Box.style.width = "35px";
        answerElem1Box.style.height = "35px";
        answerElem1Box.style.transform = "translate(0%, -50%)";
        answerElem1Box.style.backgroundColor = "red";
        answerElem1Box.style.border = "4px solid black";
        answerElem1Box.style.boxSizing = "border-box";
        answerElem1Container.appendChild(answerElem1Box);

        var answerElem2Box = document.createElement("div");
        answerElem2Box.style.position = "absolute";
        answerElem2Box.style.top = "50%";
        answerElem2Box.style.left = "10px";
        answerElem2Box.style.width = "35px";
        answerElem2Box.style.height = "35px";
        answerElem2Box.style.transform = "translate(0%, -50%)";
        answerElem2Box.style.backgroundColor = "yellow";
        answerElem2Box.style.border = "4px solid black";
        answerElem2Box.style.boxSizing = "border-box";
        answerElem2Container.appendChild(answerElem2Box);

        var answerElem3Box = document.createElement("div");
        answerElem3Box.style.position = "absolute";
        answerElem3Box.style.top = "50%";
        answerElem3Box.style.left = "10px";
        answerElem3Box.style.width = "35px";
        answerElem3Box.style.height = "35px";
        answerElem3Box.style.transform = "translate(0%, -50%)";
        answerElem3Box.style.backgroundColor = "green";
        answerElem3Box.style.border = "4px solid black";
        answerElem3Box.style.boxSizing = "border-box";
        answerElem3Container.appendChild(answerElem3Box);


        var answerElem4Box = document.createElement("div");
        answerElem4Box.style.position = "absolute";
        answerElem4Box.style.top = "50%";
        answerElem4Box.style.left = "10px";
        answerElem4Box.style.width = "35px";
        answerElem4Box.style.height = "35px";
        answerElem4Box.style.transform = "translate(0%, -50%)";
        answerElem4Box.style.backgroundColor = "blue";
        answerElem4Box.style.border = "4px solid black";
        answerElem4Box.style.boxSizing = "border-box";
        answerElem4Container.appendChild(answerElem4Box);

        var answerElem1 = document.createElement("div");
        answerElem1.style.color = "lightsalmon";
        answerElem1.style.textAlign = "center";
        answerElem1.style.top = "50%";
        answerElem1.style.left = "50%";
        answerElem1.style.transform = "translate(-50%, -50%)";
        answerElem1.style.position = "absolute";
        answerElem1.style.fontSize = "30px";
        answerElem1.style.width = "95%";
        answerElem1Container.appendChild(answerElem1);

        var answerElem2 = document.createElement("div");
        answerElem2.style.color = "lightyellow";
        answerElem2.style.textAlign = "center";
        answerElem2.style.top = "50%";
        answerElem2.style.left = "50%";
        answerElem2.style.transform = "translate(-50%, -50%)";
        answerElem2.style.position = "absolute";
        answerElem2.style.fontSize = "30px";
        answerElem2.style.width = "95%";
        answerElem2Container.appendChild(answerElem2);  
        
        var answerElem3 = document.createElement("div");
        answerElem3.style.color = "lightgreen";
        answerElem3.style.textAlign = "center";
        answerElem3.style.top = "50%";
        answerElem3.style.left = "50%";
        answerElem3.style.transform = "translate(-50%, -50%)";
        answerElem3.style.position = "absolute";
        answerElem3.style.fontSize = "30px";
        answerElem3.style.width = "95%";
        answerElem3Container.appendChild(answerElem3);
        
        var answerElem4 = document.createElement("div");
        answerElem4.style.color = "lightblue";
        answerElem4.style.textAlign = "center";
        answerElem4.style.top = "50%";
        answerElem4.style.left = "50%";
        answerElem4.style.transform = "translate(-50%, -50%)";
        answerElem4.style.position = "absolute";
        answerElem4.style.fontSize = "30px";
        answerElem4.style.width = "95%";
        answerElem4Container.appendChild(answerElem4);
        
        
        answerElem1Container.style.display = "none";
        answerElem2Container.style.display = "none";
        answerElem3Container.style.display = "none";
        answerElem4Container.style.display = "none";

        switch(node[node.correctPath].color) {
            case "red":
                answerElem1Container.style.display = "block";
                answerElem1.textContent = q.answer;
                break;
            case "yellow":
                answerElem2Container.style.display = "block";
                answerElem2.textContent = q.answer;
                break;
            case "green":
                answerElem3Container.style.display = "block";
                answerElem3.textContent = q.answer;
                break;
            case "blue":
                answerElem4Container.style.display = "block";
                answerElem4.textContent = q.answer;
                break;
        }
        var e = ["left", "middle", "right"];
        var f = 0;
        for(var i of e){
            if(node[i] == null || node.correctPath == i){
                continue;
            }
            var a = node[i].color;
            switch(a) {
                case "red":
                    answerElem1Container.style.display = "block";
                    answerElem1.textContent = wrong_answers[f];
                    break;
                case "yellow":
                    answerElem2Container.style.display = "block";
                    answerElem2.textContent = wrong_answers[f];
                    break;
                case "green":
                    answerElem3Container.style.display = "block";
                    answerElem3.textContent = wrong_answers[f];
                    break;
                case "blue":
                    answerElem4Container.style.display = "block";
                    answerElem4.textContent = wrong_answers[f];
                    break;
            }
            f++;
        }
        switch(node.color) {
            case "red":
                answerElem1Container.style.display = "block";
                answerElem1.textContent =  wrong_answers[f];
                break;
            case "yellow":
                answerElem2Container.style.display = "block";
                answerElem2.textContent = wrong_answers[f];
                break;
            case "green":
                answerElem3Container.style.display = "block";
                answerElem3.textContent = wrong_answers[f];
                break;
            case "blue":
                answerElem4Container.style.display = "block";
                answerElem4.textContent = wrong_answers[f];
                break;
        }




        box.preCollisionCallback = function (contact) {
            if(questionElement != null){
                return;
            }
            if (contact.body1.maxParent == player || contact.body2.maxParent == player) {
                if (node.correctPath != null) {
                    questionElement = element;
                    this.document.body.appendChild(questionElement);
                }
            }
        }.bind(this)
        box.setRestitution(0);
        box.setFriction(0);
        box.mesh.castShadow = true;
        box.mesh.receiveShadow = true;

        box.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.world.addComposite(box);
        this.graphicsEngine.addToScene(box.mesh);
    }
    createWin(pos, node) {
        pos.y += this.height / 2;
        var box = new Box({
            width: 10 + Math.random(),
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
        if (node == null) {
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
            width: 10 + Math.random(),
            height: this.height + Math.random(),
            depth: direction.magnitude() + 10,
            local: {
                body: {
                    mass: Infinity,
                }
            },
            global: {
                body: {
                    position: new Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2),
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
        box.preCollisionCallback = function (contact) {
            
            if (contact.body1.maxParent == player || contact.body2.maxParent == player) {
                if (questionElement != null) {
                    document.body.removeChild(questionElement);
                    questionElement = null;
                }
            }
        }.bind(this)
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