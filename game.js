const CanvasWidth = 800;
const CanvasHeight = 450;
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);

let keysPressed = {
    left: false,
    right: false,
    up: false,
};

function keyPressed(pressed, event) {
    if (event.keyCode == 37) {
        keysPressed.left = pressed;
    }
    else if (event.keyCode == 39) {
        keysPressed.right = pressed;
    }
    else if (event.keyCode == 38 || event.keyCode == 32) { // up or space
        keysPressed.up = pressed;
    }
}
function keydown(event) {
    keyPressed(true, event);
}
function keyup(event) {
    keyPressed(false, event);
}

const params = new URLSearchParams(window.location.search);
const server = params.get("server");
const isServer = !server;
let lastPeerId = localStorage.getItem("lastPeerId");
if (!isServer || !lastPeerId) {
    lastPeerId = undefined;
}
const logName = isServer ? 'SERVER' : 'CLIENT';

async function initPeer() {
    const iceToken = "WQe3H2X3uc01WkyRats9lpPp+5vRLYTJZkXRCn11Cy8EkczuRznplSXwjdTxFjnCtbVu3/RGTP2yaAUC8yP59TAXMuxG9gxAc2BrdHocOjfKg61NYFZdZcnXWwk9YAq74iQugGWZrWwquR89HswYDIp6VZnoMYifdLzJCy/oRYDrrt7DOO/HxKcuXVWAxPx3+18BNKfPRV1NtPejGcDrStMIY3gHvkEJ3GH05P77JXt6C/tL/daIpjUM3DIKvVJhgTBYB9zW13zH7wCuZjAUR33dNGPv5dOXzs5k96AGiC4rM8U+z2o6FJnFHsQSl3BATRYKpCyGuLfighdMuBEjEqfbwrzpaFUTZLmzDYHaS7F/9Wu26KYOtaKugx/SV6G74ZKcE00MafVr5pbwY31dOXX17yadUabWq46ldpXYlMDLwxPrWFmLpEDYaM2/pzC7bzpqtluYw5QynalsSwAhSvACvMmcM+x33yZbvcTAOUJ5PnDGWBLR9wJCWZtwIDlkyOYzMBwpaiH5XwIrabrWRmBXc9tB/1Xi/C1/8vzSNRaLAcFDbXbqJbNfdgD05IIwicgggNQxPmMbOb3pUylaUjzjHxR1/XRpCW6fKtpZ5Sk6pMkIoERZ9t/jWCq6LsYiOrmTqdEtatC8qb+je346tHG43BTB5dmvZEIYgOkYib7ao1iEHXZNe5dosFSHaQs1IRACbfKYRM/mZ+IA42pUKAB3f7KuDqbyrWNeAkKObb0t3xWkKHh9aa8jlTeKRLQBYjMdy0cul+kne/XUdsHY4c/FuzdYvle0Sdcrd/RxeHOF0fjjWal2MaRYZw==";
    let peer;
    try {
        peer = new Peer(lastPeerId, JSON.parse(await aesGcmDecrypt(iceToken, window.location.host)));
    } catch {
        peer = new Peer(lastPeerId);
        console.log('Use default PeerJS config');
    }
    peer.on('error', function (err) {
        console.log(logName + ': Peer error:' + err);
    });
    peer.on('disconnected', function () {
        console.log(logName + ': peer disconnected');
        setTimeout(() => {
            console.log(logName + ': peer.reconnect()');
            peer.reconnect();
        }, 3000);
    })
    peer.on('close', function (err) {
        console.log(logName + ': close:' + err);
    });
    let firstOpen = true;
    let client = null;
    peer.on('open', function (id) {
        if (!firstOpen) {
            console.log(logName + ': peer re-opened');
        } else {

            console.log(logName + ': peer opened');
        }
        if (isServer) {
            if (!firstOpen) {
                return;
            }
            localStorage.setItem("lastPeerId", peer.id);
            document.getElementById("myId").innerText = "Other player can join you at: "
                + window.location.origin + window.location.pathname + "?server=" + peer.id;
            const server = new Server();
            server.runTick();
            peer.on('connection', function (conn) {
                console.log(logName + ': Received a client connection: ' + conn.peer);
                conn.on('open', function () {
                    server.onConnect(conn);
                });
            });
        } else {

            if (client == null) {
                client = new Client(peer);
                client.runTick();
            }
        }
        firstOpen = false;
    });
}
initPeer();



class Server {
    static tickDuration = 1000.0 / 30;
    constructor() {
        this.connections = [];
        const serverPlayer = new Player(0);
        this.world = new World(true, [serverPlayer], serverPlayer.id);
        this.tickCount = 0;
    }
    onConnect(conn) {
        if (!this.isARefreshOfExistingConnection(conn)) {
            this.connections.push(conn);
            const player = new Player(this.world.players.length);
            this.world.players.push(player);
            this.initConnection(conn, player);
        }
        this.removeUnconnectedClients();
        this.world.arrangeTeams();
        this.sendWorld();
    }
    isARefreshOfExistingConnection(conn) {
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peer == conn.peer) {
                const player = this.connections[i].player;
                console.log(logName + `: Player ${player.id} has reconnected`);
                this.initConnection(conn, player);
                this.connections[i] = conn;
                return true;
            }
        }
        return false;
    }
    initConnection(conn, player) {
        player.connection = conn;
        conn.player = player;
        const self = this;
        conn.on('data', function (data) {
            self.onReceiveMsg(player, data);
        });
    }
    removeUnconnectedClients() {
        let changed = false;
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peerConnection == null || this.connections[i].peerConnection.connectionState != 'connected') {
                this.connections.splice(i, 1);
            }
        }
        for (let i = 1; i < this.world.players.length; i++) {// index 0 is the server player
            if (this.world.players[i].connection.peerConnection == null || this.world.players[i].connection.peerConnection.connectionState != 'connected') {
                this.world.players.splice(i, 1);
                changed = true;
            }
        }
        return changed;
    }
    runTick() {
        this.tickCount++;
        if (this.tickCount % 30 == 0) {
            if (this.removeUnconnectedClients()) {
                this.world.arrangeTeams();
                this.sendWorld();
            }
        }
        const updates = this.world.update();
        if (updates.length != 0) {
            this.broadcastAll({ t: 'updates', updates });
        }
        this.world.paint();
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    broadcastAll(msg) {
        for (let c of this.connections) {
            c.send(msg);
        }
    }
    sendWorld() {
        const msg = this.world.getNewWorldMsg();
        for (let c of this.connections) {
            msg.yourId = c.player.id;
            c.send(msg);
        }
    }
    onReceiveMsg(player, msg) {
        if (msg.t == 'updates') {
            this.world.onUpdates(msg.updates);
            for (let c of this.connections.filter(c => c.player.id != player.id)) {
                c.send(msg);
            }
        }
    }
}

class Client {
    constructor(peer) {
        this.peer = peer;
        this.connection = null;
        this.world = null;
        this.tickNumber = 0;
        this.lastConnectTick = -999999;
        this.refreshConnection();
    }
    refreshConnection() {
        if (this.connection == null || this.connection.peerConnection == null
            || (this.connection.peerConnection.connectionState != 'connected' && (this.tickNumber - this.lastConnectTick) / 30 > 10)) {
            console.log(logName + ': connect to server');
            this.connection = this.peer.connect(server);
            this.lastConnectTick = this.tickNumber;
            const self = this;
            this.connection.on('data', function (data) {
                self.onData(data);
            });
        }
    }
    runTick() {
        this.tickNumber++;
        if (this.tickNumber % 15 == 0) {
            this.refreshConnection();
        }
        if (this.world != null) {
            const updates = this.world.update();
            if (updates.length != 0) {
                this.connection.send({ t: 'updates', updates });
            }
            this.world.paint();
        }
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    onData(msg) {
        if (msg.t == 'newWorld') {
            this.world = World.newWorld(msg);
        }
        if (msg.t == 'updates' && this.world != null) {
            this.world.onUpdates(msg.updates);
        }
    }
}

function square(x) {
    return x * x;
}
class Player {

    constructor(id) {
        this.id = id;

        this.x = 200;
        this.y = 200;
        this.color = "blue";
        this.vx = 0;
        this.vy = 0;
        this.radius = 40;
        this.inputX = 0;
        this.inputY = 0;

    }
    updateLocalPlayer() {
        let changed = false;
        if (keysPressed.left) {
            if (this.inputX != -1) {
                this.inputX = -1;
                this.vx = 0;
                changed = true;
            }
        } else if (keysPressed.right) {
            if (this.inputX != 1) {
                this.inputX = 1;
                this.vx = 0;
                changed = true;
            }
        } else if (this.inputX != 0) {
            this.inputX = 0;
            this.vx = 0;
            changed = true;
        }
        return changed;
    }
    update() {
        let accX = Math.abs(this.vx) < 10 ? 3 : Math.abs(this.vx) < 15 ? 2 : 1;

        const newVx = this.vx + this.inputX * accX;
        const maxVx = this.inputX * 20;
        if (this.inputX < 0) {
            this.vx = Math.max(newVx, maxVx);
        } else if (this.inputX > 0) {
            this.vx = Math.min(newVx, maxVx);
        } else {
            this.vx = 0;
        }
        this.x += this.vx
        let minX = 0;
        let maxX = CanvasWidth;
        this.x = Math.max(minX + this.radius, Math.min(maxX - this.radius, this.x));

    }

    paint() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    getMsg() {
        return { t: 'playerMove', id: this.id, x: this.x, y: this.y, vx: this.vx, vy: this.vy, ix: this.inputX, iy: this.inputY, ij: this.isJumping };
    }
    onMessage(msg) {
        if (msg.id == this.id && msg.t === 'playerMove') {
            this.x = msg.x;
            this.y = msg.y;
            this.vx = msg.vx;
            this.vy = msg.vy;
            this.inputX = msg.ix;
            this.inputY = msg.iy;
            this.isJumping = msg.ij;
        }
    }
}

class World {

    constructor(isServer, players, localPlayerId) {
        this.isServer = isServer;
        this.players = players;

        this.localPlayer = players.find(p => p.id == localPlayerId);
        if (!this.localPlayer) {
            throw new Error(`Player not found ${localPlayerId}`);
        }

    }
    update() {
        const changed = this.localPlayer.updateLocalPlayer();
        for (let p of this.players) {
            p.update();
        }
        const updates = [];

        return updates;
    }
    paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let p of this.players) {
            p.paint();
        }

    }

    getNewWorldMsg() {
        return {
            t: 'newWorld',
            p: this.players.map(p => { return { id: p.id, x: p.x, y: p.y, r: p.radius, t: p.team } }),
            b: { x: this.ball.x, y: this.ball.y },
            yourId: '',
        }
    }
    static newWorld(msg) {
        const players = msg.p.map(p => {
            let player = new Player(p.id);
            player.x = p.x;
            player.y = p.y;
            player.radius = p.r;
            player.team = p.t;
            return player;
        });
        const world = new World(false, players, msg.yourId);

        return world;
    }
    onUpdates(updates) {
        for (let m of updates) {
            for (let p of this.players) {
                p.onMessage(m);
            }
        }
    }
}