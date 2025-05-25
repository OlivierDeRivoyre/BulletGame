
const server = new URLSearchParams(window.location.search).get("server");
const isServer = !server;
let lastPeerId = localStorage.getItem("bulletLastPeerId");
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
            localStorage.setItem("bulletLastPeerId", peer.id);
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
    static tickDuration = 30;//30ms, it is around 30 ticks per second
    constructor() {
        this.connections = [];
        game = new Game(true);
        if(!new URLSearchParams(window.location.search).get("new")){        
            game.load();
        }
        game.currentView = game.worldMap;
    }
    onConnect(conn) {
        if (!this.isARefreshOfExistingConnection(conn)) {
            this.connections.push(conn);
            this.initConnection(conn);
        }
        this.removeUnconnectedClients();
        this.sendWorld();
    }
    isARefreshOfExistingConnection(conn) {
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peer == conn.peer) {                
                console.log(logName + `: Player ${conn.peer} has reconnected`);
                this.initConnection(conn);
                this.connections[i] = conn;
                return true;
            }
        }
        return false;
    }
    initConnection(conn) {
        const self = this;
        conn.on('data', function (data) {
            self.onReceiveMsg(data);
        });
    }
    removeUnconnectedClients() {
        let changed = false;
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peerConnection == null
                || this.connections[i].peerConnection.connectionState != 'connected') {
                this.connections.splice(i, 1);
            }
        }
        /*     for (let i = 1; i < this.worldLevel.players.length; i++) {// index 0 is the server player
                 if (this.worldLevel.players[i].connection.peerConnection == null
                     || this.worldLevel.players[i].connection.peerConnection.connectionState != 'connected') {
                     this.worldLevel.players.splice(i, 1);
                     changed = true;
                 }
             }*/
        return changed;
    }
    runTick() {
        tickNumber++;
        if (tickNumber % 30 == 0) {
            this.removeUnconnectedClients();
        }
        const updates = game.update();
        if (updates.length != 0) {
            this.broadcastAll({ t: 'updates', updates});
        }
        game.paint();
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    broadcastAll(msg) {
        msg.tick = tickNumber;
        for (let c of this.connections) {
            c.send(msg);
        }
    }
    sendWorld() {
        const msg = game.getWorldMsg();
        this.broadcastAll({t: 'world', world: msg});
    }
    onReceiveMsg(msg) {
        if (msg.t == 'updates') {
            const response = game.onUpdates(msg.updates);
            if(response){
                if(response.t){
                    this.broadcastAll({ t: 'updates', updates: [response]});
                } else if(response.length > 0){
                    this.broadcastAll({ t: 'updates', updates: response});
                }
            }
        }
    }
}

class Client {
    constructor(peer) {
        this.peer = peer;
        this.connection = null;
        this.worldLevel = null;
        this.lastConnectTick = -999999;
        this.refreshConnection();
    }
    refreshConnection() {
        if (this.connection == null || this.connection.peerConnection == null
            || (this.connection.peerConnection.connectionState != 'connected' && (tickNumber - this.lastConnectTick) / 30 > 10)) {
            console.log(logName + ': connect to server');
            this.connection = this.peer.connect(server);
            this.lastConnectTick = tickNumber;
            if (!this.connection) {
                return;
            }
            game = new Game(false);
            const self = this;
            this.connection.on('data', function (data) {
                self.onData(data);
            });
        }
    }
    runTick() {
        tickNumber++;
        if (tickNumber % 15 == 0) {
            this.refreshConnection();
        }
        if (game != null) {
            const updates = game.update();
            if (updates.length != 0) {
                this.connection.send({ t: 'updates', updates });
            }
            game.paint();
        }
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    onData(msg) {
        if (msg.t == 'world') {
            game.refreshWorldFromMsg(msg.world);
        }
        if (msg.t == 'updates') {
            game.onUpdates(msg.updates);
        }
    }
}

initPeer();