const CanvasCellWidth = 16;
const CanvasCellHeight = 9;
const CanvasWidth = 64 * CanvasCellWidth;//1024
const CanvasHeight = 64 * CanvasCellHeight;//576
const canvas = document.createElement("canvas");
canvas.width = CanvasWidth;
canvas.height = CanvasHeight;
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;

class Input {
    constructor() {
        this.keysPressed = {
            left: false,
            right: false,
            up: false,
            down: false,
            s1: false,
            s2: false,
            s3: false,
            s4: false,
        };
        this.mouse = { x: 0, y: 0 };
        this.mouseClicked = false;
        this.mouse2Clicked = false;
        window.addEventListener('keydown', (e) => this.keydown(e), false);
        window.addEventListener('keyup', (e) => this.keyup(e), false);
        window.addEventListener('contextmenu', (e) => this.contextmenu(e), false);
    }

    keyPressed(pressed, event) {
        if (event.keyCode == 37 || event.code == 'KeyA') {
            this.keysPressed.left = pressed;
        } else if (event.keyCode == 39 || event.code == 'KeyD') {
            this.keysPressed.right = pressed;
        } else if (event.keyCode == 38 || event.code == 'KeyW') {
            this.keysPressed.up = pressed;
        } else if (event.keyCode == 40 || event.code == 'KeyS') {
            this.keysPressed.down = pressed;
        } else if (event.code == 'KeyQ') {
            this.keysPressed.s1 = pressed;
        } else if (event.code == 'KeyE') {
            this.keysPressed.s2 = pressed;
        } else if (event.code == 'KeyR') {
            this.keysPressed.s3 = pressed;
        } else if (event.code == 'KeyF') {
            this.keysPressed.s4 = pressed;
        }
    }
    keydown(event) {
        this.keyPressed(true, event);
    }
    keyup(event) {
        this.keyPressed(false, event);
    }
    mouseMove(mouse) {
        this.mouse = mouse;
    }
    mouseButton(mouse, pressed, rightclick) {
        this.mouse = mouse;
        if (rightclick) {
            this.mouse2Clicked = pressed;
        } else {
            this.mouseClicked = pressed;
        }
    }
    contextmenu(e) {
        e.preventDefault();
        return false;
    }
}
const input = new Input();

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




class Server {
    static tickDuration = 1000.0 / 30;
    constructor() {
        this.connections = [];
        const serverPlayer = new Player(0);
        this.world = new World(true, [serverPlayer], serverPlayer.id);
        screen.currentView = this.world;
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
        screen.paint();
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
            screen.paint();
        }
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    onData(msg) {
        if (msg.t == 'newWorld') {
            this.world = World.newWorld(msg);
            screen.currentView = this.world;
        }
        if (msg.t == 'updates' && this.world != null) {
            this.world.onUpdates(msg.updates);
        }
    }
}

function loadImg(name) {
    const img = new Image();
    img.src = "img/" + name + ".png";
    return img;
}
const dungeonTileSet = loadImg("0x72_DungeonTilesetII_v1.7");

function getDungeonTileSetHeroSprite(j) {
    const x = 128;
    const y = j * 32;
    const topMargin = 11;
    return new DoubleSprite(dungeonTileSet, x, y + topMargin, 16, 32 - topMargin);
}
function getDungeonTileSetVilainSprite(i) {
    const x = 368;
    const y = 9 + i * 24;
    return new DoubleSprite(dungeonTileSet, x, y, 16, 24);
}
class SimpleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, this.tWidth, this.tHeight
        );
    }
    paintScale(x, y, w, h) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, w, h
        );
    }
    paintRotate(x, y, w, h, angus) {
        ctx.save();
        ctx.translate(x + this.tWidth / 2, y + this.tHeight / 2);
        ctx.rotate(angus);
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}
class DoubleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y, index, reverse) {
        index |= 0;
        if (reverse) {
            this.paintReverse(x, y, index);
            return;
        }
        // ctx.fillStyle = "pink"; ctx.fillRect(x, y, this.tWidth, this.tHeight);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            x, y,
            this.tWidth * 2, this.tHeight * 2
        );
    }
    paintReverse(x, y, index) {
        ctx.save();
        ctx.translate(x + this.tWidth, y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            0, 0, this.tWidth * 2, this.tHeight * 2
        );
        ctx.restore();
    }
}

function square(x) {
    return x * x;
}
class Player {
    constructor(id) {
        this.id = id;
        this.x = 32 * 5;
        this.y = 32 * 5;
        this.vx = 0;
        this.vy = 0;
        this.inputX = 0;
        this.inputY = 0;
        this.sprite = getDungeonTileSetHeroSprite(0);
    }
    getCenterCoord() {
        return { x: this.x + this.sprite.tWidth, y: this.y + this.sprite.tHeight };
    }
    updateLocalPlayer(input, world) {
        let changed = false;
        if (input.keysPressed.left) {
            if (this.inputX != -1) {
                this.inputX = -1;
                this.vx = 0;
                changed = true;
            }
        } else if (input.keysPressed.right) {
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
        if (input.keysPressed.up) {
            if (this.inputY != -1) {
                this.inputY = -1;
                this.vy = 0;
                changed = true;
            }
        } else if (input.keysPressed.down) {
            if (this.inputY != 1) {
                this.inputY = 1;
                this.vy = 0;
                changed = true;
            }
        } else if (this.inputY != 0) {
            this.inputY = 0;
            this.vy = 0;
            changed = true;
        }
        return changed;
    }
    update() {
        function getNewSpeed(v, input) {
            const maxSpeed = 4;
            const ratio = Math.abs(v) < maxSpeed * 0.5 ? 1
                : Math.abs(v) < maxSpeed * 0.8 ? 0.5
                    : 0.3;
            const acc = ratio * 2;
            const newV = v + input * acc;
            const maxV = input * maxSpeed;
            if (input < 0) {
                return Math.max(newV, maxV);
            } else if (input > 0) {
                return Math.min(newV, maxV);
            } else {
                return Math.floor(v * 10 / 2) / 10;
            }
        }
        this.vx = getNewSpeed(this.vx, this.inputX);
        this.vy = getNewSpeed(this.vy, this.inputY);
        this.x += this.vx;
        this.y += this.vy;
    }

    paint(camera) {
        this.sprite.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), 0, false);
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

class ActionBar {
    static MaxSpells = 5;
    constructor(player) {
        this.player = player;
        this.spells = new Array(ActionBar.MaxSpells);
        this.basicAttack = allSpells.basicAttack;
        this.spells[0] = allSpells.shotgun;
        this.spells[1] = allSpells.curseGround;
        this.spells[2] = allSpells.rootingProjectile;
        this.spells[3] = allSpells.healProjectile;
        this.spells[4] = allSpells.noSpell;
        this.topX = 400;
        this.topY = CanvasHeight - 38;
        this.shortcuts = ['M2', 'Q', 'E', 'R', 'F'];
    }
    tryTrigger(spell, world) {
        if (spell.lastAttackTick && world.tick < spell.lastAttackTick + spell.cooldown * 30) {
            return;
        }
        if (spell.trigger(this.player, world.camera.toWorldCoord(input.mouse), world)) {
            spell.lastAttackTick = world.tick;
        }
    }
    update(input, world) {
        if (input.mouseClicked) {
            this.tryTrigger(this.basicAttack, world);
        }
        else if (input.mouse2Clicked) {
            this.tryTrigger(this.spells[0], world);
        }
        else if (input.keysPressed.s1) {
            this.tryTrigger(this.spells[1], world);
        }
        else if (input.keysPressed.s2) {
            this.tryTrigger(this.spells[2], world);
        }
        else if (input.keysPressed.s3) {
            this.tryTrigger(this.spells[3], world);
        }
        else if (input.keysPressed.s4) {
            this.tryTrigger(this.spells[4], world);
        }
    }
    paint() {
        ctx.fillStyle = '#222';
        ctx.fillRect(this.topX, this.topY, ActionBar.MaxSpells * 34 + 2, 36);
        for (let i = 0; i < this.spells.length; i++) {
            const buttonX = 2 + this.topX + i * 34;
            if (this.spells[i] == null) {
                continue;
            }
            ctx.fillStyle = '#444';
            ctx.fillRect(buttonX, this.topY + 2, 32, 32);
            this.spells[i].sprite.paintScale(buttonX, this.topY + 2, 32, 32);
            ctx.fillStyle = "white";
            ctx.font = "12px Consolas";
            ctx.textRendering = "geometricPrecision";
            ctx.fillText(this.shortcuts[i], buttonX + 2, this.topY + 32);
        }
    }
}

class AggroMobBrain {

}
class Mob {
    constructor(sprite, brain, x, y) {
        this.sprite = sprite;
        this.brain = brain;
        this.x = x;
        this.y = y;
        this.maxLife = 100;
        this.life = 100;
    }
    update() {

    }
    paint(camera) {
        this.sprite.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), 0, false);
    }
}
class CellSprite {
    constructor(sprite) {
        if (sprite.toLowerCase) {
            this.color = sprite;
        } else {
            this.sprite = sprite;
        }
    }
    paint(x, y) {
        if (this.color) {
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.fillStyle = this.color;
            ctx.rect(x, y, 64, 64);
            ctx.fill();
        } else {
            this.sprite.paintScale(x, y, 64, 64);
        }
    }
}
class CellSpriteFactory {
    constructor() {
        this.grass1 = new CellSprite('#509060');
        this.grass2 = new CellSprite('#509360');
        this.water = new CellSprite('#55B');
    }
}
const cellSpriteFactory = new CellSpriteFactory();
class Cell {
    constructor(cellSprites) {
        this.cellSprites = cellSprites;
    }
    paint(x, y) {
        for (let s of this.cellSprites) {
            s.paint(x, y);
        }
    }
}

class Map {
    constructor() {
        this.borderCell = new Cell([cellSpriteFactory.water]);
        this.cells = new Array(10);
        for (var j = 0; j < this.cells.length; j++) {
            this.cells[j] = new Array(50);
            for (var i = 0; i < this.cells[j].length; i++) {
                const grass = (i + j) % 2 == 0 ? cellSpriteFactory.grass1 : cellSpriteFactory.grass2;
                this.cells[j][i] = new Cell([grass]);
            }
        }
    }
    getCell(x, y) {
        const i = Math.floor(x / 64);
        const j = Math.floor(y / 64);
        if (j < 0 || j >= this.cells.length) {
            return this.borderCell;
        }
        const row = this.cells[j];
        if (i < 0 || i >= row.length) {
            return this.borderCell;
        }
        return row[i];
    }
    paint(camera) {
        const topX = camera.topX;
        const topY = camera.topY;
        const offsetX = Math.floor(topX / 64) * 64 - topX;
        const offsetY = Math.floor(topY / 64) * 64 - topY;
        for (let j = -1; j <= CanvasCellHeight; j++) {
            for (let i = -1; i <= CanvasCellWidth; i++) {
                const x = topX + i * 64;
                const y = topY + j * 64;
                this.getCell(x, y).paint(offsetX + i * 64, offsetY + j * 64);
            }
        }
    }
}

class Level {
    constructor() {
        this.map = new Map();
        this.mobs = [];
        this.mobs.push(new Mob(getDungeonTileSetVilainSprite(0), new AggroMobBrain(), 10 * 32, 5 * 32));
    }
    update() {

    }

}

class World {
    constructor(isServer, players, localPlayerId) {
        this.isServer = isServer;
        this.players = players;
        this.mouse = null;
        this.localPlayer = players.find(p => p.id == localPlayerId);
        if (!this.localPlayer) {
            throw new Error(`Player not found ${localPlayerId}`);
        }
        this.camera = new CameraOffset(this.localPlayer);
        this.actionBar = new ActionBar(this.localPlayer, this);
        this.level = new Level();
        this.map = this.level.map;
        this.friendlyProjectiles = [];
        this.dangerousProjectiles = [];
        this.tick = 0;
        this.annimAdded = false;
    }
    addProjectile(anim, from) {
        this.friendlyProjectiles.push(anim);
        this.annimAdded = true;
    }
    update() {
        this.tick++;
        if (this.annimAdded) {
            this.friendlyProjectiles.sort((a, b) => a.zIndex - b.zIndex);
            this.annimAdded = false;
        }
        const changed = this.localPlayer.updateLocalPlayer(input, this);
        for (let p of this.players) {
            p.update();
        }
        this.camera.update();
        for (let i = this.friendlyProjectiles.length - 1; i >= 0; i--) {
            if (!this.friendlyProjectiles[i].update(this)) {
                this.friendlyProjectiles.splice(i, 1);
            }
        }
        for (let i = this.dangerousProjectiles.length - 1; i >= 0; i--) {
            if (!this.dangerousProjectiles[i].update(this)) {
                this.dangerousProjectiles.splice(i, 1);
            }
        }
        this.level.update();
        this.actionBar.update(input, this);
        const updates = [];

        return updates;
    }
    paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.level.map.paint(this.camera);
        for (let p of this.friendlyProjectiles) {
            p.paint(this.camera);
        }
        for (let p of this.dangerousProjectiles) {
            p.paint(this.camera);
        }
        for (let mob of this.level.mobs) {
            mob.paint(this.camera);
        }
        for (let p of this.players) {
            p.paint(this.camera);
        }
        this.actionBar.paint();
        this.paintCursor();
    }
    paintCursor() {
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 2.5, 2 * Math.PI, 0);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 2, 2 * Math.PI, 0);
        ctx.fillStyle = 'red';
        ctx.fill();
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
class CameraOffset {
    constructor(localPlayer) {
        this.localPlayer = localPlayer;
        this.topX = 0;
        this.topY = 0;
    }
    update() {
        this.topX = Math.floor(this.localPlayer.x - CanvasWidth / 2);
        this.topY = Math.floor(this.localPlayer.y - CanvasHeight / 2);
    }
    toCanvasX(x) {
        return Math.floor(x - this.topX)
    }
    toCanvasY(y) {
        return Math.floor(y - this.topY)
    }
    toWorldCoord(canvasPoint) {
        return {
            x: canvasPoint.x + this.topX,
            y: canvasPoint.y + this.topY,
        };
    }
}
class Screen {
    constructor() {
        this.screenCanvas = document.getElementById("myCanvas");
        this.screenCanvas.style.imageRendering = 'pixelated';
        this.screenCtx = this.screenCanvas.getContext("2d");
        this.currentView = null;
        this.windowResize();
        window.addEventListener('resize', () => this.windowResize(), false);
        window.addEventListener('mousemove', (e) => this.mouseMove(e), false);
        window.addEventListener('mousedown', (e) => this.mouseDown(e), false);
        window.addEventListener('mouseup', (e) => this.mouseUp(e), false);
    }
    paint() {
        if (this.currentView) {
            this.currentView.paint();
        }
        this.screenCtx.imageSmoothingEnabled = false;
        this.screenCtx.clearRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
        this.screenCtx.drawImage(canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, this.screenCanvas.width, this.screenCanvas.height)
    }
    toCanvasCoord(x, y) {
        return {
            x: Math.floor(x * canvas.width / this.screenCanvas.width),
            y: Math.floor(y * canvas.height / this.screenCanvas.height)
        };
    }
    mouseMove(event) {
        input.mouseMove(this.toCanvasCoord(event.offsetX, event.offsetY));
    }
    mouseButton(e, pressed) {
        let rightclick = false;
        if (e.which) {
            rightclick = (e.which == 3);
        } else if (e.button) {
            rightclick = (e.button == 2);
        }
        input.mouseButton(this.toCanvasCoord(event.offsetX, event.offsetY), pressed, rightclick);
    }
    mouseDown(event) {
        this.mouseButton(event, true);
    }
    mouseUp(event) {
        this.mouseButton(event, false);
    }
    windowResize() {
        if (document.fullscreenElement) {
            this.screenCanvas.width = window.innerWidth;
            this.screenCanvas.height = window.innerHeight;
        } else {
            let w = window.innerWidth - 40;
            let h = window.innerHeight - 180;
            if (h * 16 > w * 9) {
                h = Math.floor(w * 9 / 16);
            } else {
                w = Math.floor(h * 16 / 9);
            }
            this.screenCanvas.width = w;
            this.screenCanvas.height = h;
        }
    }
    fullScreen() {
        if (this.screenCanvas.webkitRequestFullScreen) {
            this.screenCanvas.webkitRequestFullScreen();
        }
        else {
            this.screenCanvas.mozRequestFullScreen();
        }
    }
}
const screen = new Screen();
initPeer();
function fullScreen() {
    screen.fullScreen();
}

