var mapManager = {
    mapData: null,
    tLayer: new Array(),
    xCount: 0,
    yCount: 0,
    tSize: {x: 0, y: 0},
    mapSize: {x: 0 , y: 0},
    tilesets: new Array(),
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,
    view: {x: 0, y: 0, w: 1280, h: 640},
    loadMap: function(path) {
        var request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.open("GET", path, true);
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                mapManager.parseMap(request.responseText); 
            }
        };  
        request.send();    
    },
    draw: function(ctx) {
        if(!mapManager.imgLoaded || !mapManager.jsonLoaded) {
            setTimeout(function() {mapManager.draw(ctx);}, 100);
        } else {
            if (this.tLayer.length === 0)
                for(var id = 0; id < this.mapData.layers.length; id++) {
                    var layer = this.mapData.layers[id];
                    if(layer.type === "tilelayer") {
                        this.tLayer.push(layer);
                    }
                }
            for(var j = 0; j < this.tLayer.length; j++) {
                for(var i = 0; i < this.tLayer[j].data.length; i++) {
                    if(this.tLayer[j].data[i] !== 0) {
                        var tile = this.getTile(this.tLayer[j].data[i]);
                        var pX = (i % this.xCount) * this.tSize.x;
                        var pY = Math.floor(i / this.xCount) * this.tSize.x-80;
                        if(!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) 
                            continue;        
                        pX -= this.view.x;
                        pY -= this.view.y;
                        if(tile.name==="t3") {
                            ctx.drawImage(tile.img, pX, pY-20, tile.tileW, tile.tileH);
                        } else {
                             ctx.drawImage(tile.img, pX, pY, tile.tileW, tile.tileH);
                        }
                    }
                }
            }
        }
    },
    parseMap: function(tilesJSON) {
        this.mapData = JSON.parse(tilesJSON);
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.xCount * this.tSize.y;
        for(var i = 0; i < this.mapData.tilesets.length; i++) {
            var img = new Image();
            img.onload = function() {
                mapManager.imgLoadCount++;
                if(mapManager.imgLoadCount === mapManager.mapData.tilesets.length) {
                    mapManager.imgLoaded = true; 
                }
            };
            img.src = this.mapData.tilesets[i].image;
            var t = this.mapData.tilesets[i];
            var ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor(t.imageheight / mapManager.tSize.y),
                tileW: t.imagewidth,
                tileH: t.imageheight
            };
            this.tilesets.push(ts);
        }
        this.jsonLoaded = true;
    },
    getTile: function(tileIndex) {
        var tile = {
            img: null,
            px: 0,
            py: 0,
            tileW: 0,
            tileH: 0,
            name: null
        };
        var tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        tile.tileH = tileset.tileH;
        tile.tileW = tileset.tileW;
        tile.name = tileset.name;
        var id = tileIndex - tileset.firstgid;
        var x = id % tileset.xCount;
        var y = Math.floor(id / tileset.xCount);
        tile.px = x * mapManager.tSize.x;
        tile.py = y * mapManager.tSize.y;
        return tile;
        },

    getTileset: function(tileIndex) {
        for(var i = mapManager.tilesets.length - 1; i >=0; i--) {
            if(mapManager.tilesets[i].firstgid <= tileIndex) {
                return mapManager.tilesets[i];
                }
            }
        return null;
    },

    isVisible: function(x, y, width, heigth) {
    if(x + width < this.view.x || y + heigth < this.view.y || x > this.view.x + this.view.w || y > this.view.y + this.view.h) {
        return false;
        }
    return true;
    },
    parseEntities: function() {
        if(!mapManager.imgLoaded || !mapManager.jsonLoaded) {
            setTimeout(function() {mapManager.parseEntities();}, 100);
        } else
            for(var j = 0; j < this.mapData.layers.length; j++)
        if(this.mapData.layers[j].type === 'objectgroup') {
            var entities = this.mapData.layers[j];
                for(var i = 0; i < entities.objects.length; i++) {
                    var e = entities.objects[i];
                    try {
                        var obj = Object.create(gameManager.factory[e.type]);
                        obj.name = e.name;
                        obj.pos_x = e.x;
                        obj.pos_y = e.y;
                        obj.size_x = e.width;
                        obj.size_y = e.height;
                        gameManager.entities.push(obj);
                        if(obj.name === "player")
                            gameManager.initPlayer(obj);
                    } catch(ex) {
                        console.log("" + e.gid + e.type + ex);
                    }
                }
            }
    },
    getTilesetIdx: function(x, y) {
        var wX = x;
        var wY = y;
        var idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        return this.tLayer[1].data[idx];
    },
    centerAt: function(x, y) {
        if(x < this.view.w/2)
            this.view.x =0;
        else
            if(x > this.mapSize.x - this.view.w/2)
                this.view.x = this.mapSize.x - this.view.w;
        else
            this.view.x = x - (this.view.w/2);
    }
};
var Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 0,
    size_y: 0,
    touch: false,
    kill: function() {
        gameManager.kill(this);
    },
    extend: function(extendProto) {
        var object = Object.create(this);
        for(var property in extendProto) {
            if(this.hasOwnProperty(property) || typeof object[property] === 'undefined') {
                object[property] = extendProto[property];
            }
        }
        return object;
    }
};

var Player = Entity.extend({
    countCoins: 0,
    move_x: 0, 
    move_y: 0,
    speed: 20,
    numbL: 0,
    numbR: 0,
    left: ["rick_left1","rick_left2","rick_left3","rick_left4"],
    right: ["rick_right1","rick_right4","rick_right3","rick_right2"],
    position: "rick_right1",
    jump: false,
    win: false,
    draw: function(ctx) {
        spriteManager.drawSprite(ctx, this.position, this.pos_x, this.pos_y-70);
    },
    update: function() {
        physicManager.update(this);
    },
    onTouchEntity: function(obj) {
        if(obj.name.match(/coins[\d*]/)) {
            soundManager.play("/mus/aud1.mp3",{looping:0, volume:0.5});
            this.countCoins += 1;
            var elem = document.getElementById('pCoins');
            elem.innerHTML = this.countCoins;  
            obj.kill();
            
        }
        if(obj.name.match(/kosm/)) {
            soundManager.stopAll();
            soundManager.init();
            soundManager.play("/mus/aud2.mp3",{looping:0, volume:1});
            obj.touch = true;
            this.win = true;
            obj.move_y = 4;
            this.kill();
        }
        if(obj.name.match(/enemy[\d*]/)) {
            this.kill();
        }
    },
    onTouchMap: function(obj) {
    },
    kill: function() {
        gameManager.kill(this);
        var elem = document.getElementById('hBody');
        var elem1 = document.getElementById('aResult');
        if( this.win === true) {
            elem.innerHTML = 'ВЫ ВЫИГРАЛИ!';  
            elem1.innerHTML = 'Начать заново'; 
        } else {
            elem.innerHTML = 'ВЫ ПРОИГРАЛИ!'; 
            elem1.innerHTML = 'Попробовать еще раз'; 
        }
    }
});

var Enemy1 = Entity.extend({
    move_x: 3,
    move_y: 3,
    speed:20,
    goLeft: true,
    goIt: 0,
    left: ["enemy1_left1","enemy1_left2","enemy1_left3","enemy1_left4"],
    right: ["enemy1_right1","enemy1_right4","enemy1_right3","enemy1_right2"],
    position: "enemy1_right1",
    draw: function(ctx) {
        spriteManager.drawSprite(ctx, this.position, this.pos_x, this.pos_y-85);
    },
    update: function() {
        physicManager.update(this); 
    },
});

var Enemy2 = Entity.extend({
    move_x: 3,
    move_y: 3,
    speed:20,
    goLeft: true,
    goIt: 0,
    left: ["enemy2_left1","enemy2_left2","enemy2_left3","enemy2_left4"],
    right: ["enemy2_right1","enemy2_right4","enemy2_right3","enemy2_right2"],
    position: "enemy2_right1",
    draw: function(ctx) {
        spriteManager.drawSprite(ctx, this.position, this.pos_x, this.pos_y-100);
    },
    update: function() {
        physicManager.update(this); 
    },
});

var Rocket = Entity.extend({
    move_x: 2,
    move_y: 2,
    speed: 10,
    draw: function(ctx) {
        spriteManager.drawSprite(ctx, "kosm", this.pos_x, this.pos_y-150);
    },
    update: function() {
        if(this.touch === true) {
            physicManager.update(this); 
        }
    },
    kill: function() {
        gameManager.kill(this);
    }
});

var Coins = Entity.extend({
    draw: function(ctx) {
        spriteManager.drawSprite(ctx, "coins", this.pos_x, this.pos_y-100);
    },
});

var spriteManager = {
    image: new Image(),
    sprites: new Array(),
    imgLoaded: false,
    jsonLoaded: false,
    loadAtlas: function(atlasJson, atlasImg) {
       var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText); 
            }
        };
        request.open("GET", atlasJson, true);
        request.send();
        this.loadImg(atlasImg);
  },
    loadImg: function(imgName) {
        this.image.onload = function() {
            spriteManager.imgLoaded = true;
        };
        this.image.src = imgName;
    },
    parseAtlas: function(atlasJson) {
        var atlas = JSON.parse(atlasJson);
        for(var name in atlas.frames) {
            var frame = atlas.frames[name].frame;
            this.sprites.push({name:name,x:frame.x,y:frame.y,w:frame.w,h:frame.h});
        }
        this.jsonLoaded = true;
    },
    drawSprite: function(ctx, name, x, y) {
        if(!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(function() {
                spriteManager.drawSprite(ctx, name, x, y);
            }, 100);
        } else {
            var sprite = this.getSprite(name);
            if(!mapManager.isVisible(x, y, sprite.w, sprite.h))
                return;
            x -= mapManager.view.x;
            y -= mapManager.view.y;
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
        }
    },
    getSprite: function(name) {
        for(var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];
            if(s.name === name)
                return s;
        }
        return null;
    }
};

var eventManager = {
    bind: [],
    action: [],
    setup: function(canvas) {
        this.bind[65] = 'left';
        this.bind[68] = 'right';
        this.bind[32] = 'up';
        canvas.addEventListener("mousedown", this.onMouseDown);
        canvas.addEventListener("mouseup", this.onMouseUp);
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    },
    onKeyDown: function(event) {
        var action = eventManager.bind[event.keyCode];
        if(action)
            eventManager.action[action] = true;
    },
    onKeyUp: function(event) {
        var action = eventManager.bind[event.keyCode];
        if(action)
            eventManager.action[action] = false;
    }
}

var physicManager = {
    update: function(obj) {
        if(obj.pos_y > 650 || obj.pos_y < 0) {
            obj.kill(); 
            return "stop";
        }
        if(obj.move_x === 2 && obj.move_y === 2) {
            return "stop";
        }
        if(obj.move_y === 4) {
            obj.pos_y -=30;
            return "move";
        }
        if(obj.move_x === 3 && obj.move_y === 3) {
            var i = obj.goIt;
            j = i;
            if(i >= 4) j = i-4;
            if (obj.goLeft === true) {
                obj.pos_x +=10;
                obj.position = obj.right[j];
                i++;
                if(i === 8) {
                    obj.goIt = 0;
                    obj.goLeft = false;
                } else obj.goIt = i;
            } else {
                obj.pos_x -=10;
                obj.position = obj.left[j];
                i++;
                if(i === 8) {
                    obj.goIt = 0;
                    obj.goLeft = true;
                } else obj.goIt = i;
            }
            return "move";
        }
        if(obj.jump === true && obj.move_y === 0) {
                var newX = obj.pos_x;
                var newY = obj.pos_y + 50; 
                var ts = mapManager.getTilesetIdx(newX - 10+ obj.size_x/2, newY + obj.size_y/2);
                if(ts !== 0 && obj.onTouchMap){
                    obj.jump = false;
                    obj.onTouchMap(ts);
                }
                if(obj.jump === true) {
                    obj.pos_y += 10;
                }
        }        
        if(obj.move_x === 0 && obj.move_y === 0) {
                var newX = obj.pos_x;
                var newY = obj.pos_y + 50;
                var ts = mapManager.getTilesetIdx(newX -10 + obj.size_x/2, newY + obj.size_y/2);
                if(ts !== 0 && obj.onTouchMap){
                    return "stop";
                }
                obj.pos_y += 10;
            return "stop";
        }        
        if(obj.move_x !== 0 && obj.move_y === 0) {
                var newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
                var newY = obj.pos_y + 50;
                var ts = mapManager.getTilesetIdx(newX -10 + obj.size_x/2, newY + obj.size_y/2);
                if(ts === 0 && obj.onTouchMap){
                    obj.pos_y += 10; 
                }
        }        
        if(obj.move_y !== 0) {
                var newX = obj.pos_x ;
                var newY = obj.pos_y + 50;
                var ts = mapManager.getTilesetIdx(obj.pos_x -10 + obj.size_x/2, newY + obj.size_y/2);
                if(ts === 0 && obj.onTouchMap){
                    return;
                }
        }
        if(obj.jump === true) {
            var newX = obj.pos_x + Math.floor(obj.move_x * obj.speed)+obj.move_x*20; 
        } else {
            var newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        }
        if(newX < 10) return "stop";
        var newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        var ts = mapManager.getTilesetIdx(newX + obj.size_x/2, newY + obj.size_y/2);
        var e = this.entityAtXY(obj, newX, newY);
        if(e !== null && obj.onTouchEntity) {
            obj.onTouchEntity(e);           
        }
        if(ts !== 0 && obj.onTouchMap) {
            obj.jump = false;
            obj.onTouchMap(ts);
        }
        if(ts === 0 && e === null) {
            obj.pos_x = newX;
            obj.pos_y = newY;
        } else
            return "break";
        return "move";
    },
    entityAtXY: function(obj, x, y) {
        for(var i = 0; i < gameManager.entities.length; i++) {
            var e = gameManager.entities[i];
            if(e.name !== obj.name) {
                if(x + obj.size_x < e.pos_x || y + obj.size_y < e.pos_y || x > e.pos_x + e.size_x  || y > e.pos_y + e.size_y)
                    continue;
                return e;
            }
        }
        return null;
    }
};
var gameManager = {
    factory: {},
    entities: [],
    coinsNum: 0,
    player: null,
    laterKill: [],
    initPlayer: function(obj) {
        this.player = obj;
    },
    kill: function(obj) {
      this.laterKill.push(obj);  
    },
    update: function() {
        if(this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        if(eventManager.action["up"] && this.player.jump === false) {
            this.player.jump = true;
            this.player.move_y = -5;
        };
        if(eventManager.action["left"]) {
            this.player.move_x = -1;
            var i = this.player.numbL;
            if (i == 4) {
                i = 0;
                this.player.numbL = 0;
            }
            this.player.position = this.player.left[i];
            this.player.numbL = ++i;
            this.player.numbR = 0;
        }
        if(eventManager.action["right"]) {
            this.player.move_x = 1;
            var i = this.player.numbR;
            if (i == 4) {
                i = 0;
                this.player.numbR = 0;
            }
            this.player.position = this.player.right[i];
            this.player.numbR = ++i;
            this.player.numbL = 0;
        }
        this.entities.forEach(function(e) {
            try{
                e.update();
            } catch(ex){
            }
        });
        for(var i=0; i < this.laterKill.length; i++) {
            var idx = this.entities.indexOf(this.laterKill[i]);
            if(idx > -1)
                this.entities.splice(idx, 1);
        };
        if(this.laterKill.length > 0)
            this.laterKill.length = 0;
        mapManager.draw(ctx);
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.draw(ctx);
        
    },
    draw: function(ctx) {
        for(var e = 0; e < this.entities.length; e++)
            this.entities[e].draw(ctx);
    },
    loadAll: function() {
        mapManager.loadMap("kur.json");
        spriteManager.loadAtlas("sprites.json", "spritesheet.png");
        gameManager.factory['player'] = Player;
        gameManager.factory['coins'] = Coins;
        gameManager.factory['enemy1'] = Enemy1;
        gameManager.factory['enemy2'] = Enemy2;
        gameManager.factory['kosm'] = Rocket;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventManager.setup(canvas);
    },
    play: function() {
        soundManager.play("/mus/aud6.mp3",{looping:1, volume:0.9});
        setInterval(updateWorld, 100);
    }
};
function updateWorld() {
    ctx.clearRect(0,0,1280,640);
    gameManager.update();
}
var soundManager = {
    clips: {},
    context: null,
    gainNode:null,
    loaded:false,
    init: function() {
        this.context = new AudioContext();
        this.gainNode = this.context.createGain ? this.context.createGain(): this.context.createGainNode();        this.gainNode.connect(this.context.destination);
    },
    load: function(path, callback){
        if(this.clips[path]) {
            callback(this.clips[path]);
            return;
        }
        var clip = {path: path, buffer: null, loaded: false};
        clip.play = function (volume,loop) {
            soundManager.play(this.path,{looping: loop? loop : false, volume: volume ? volume : 1});
        };
        this.clips[path] = clip;
        var request = new XMLHttpRequest();
        request.open('GET',path,true);
        request.responseType='arraybuffer';
        request.onload = function () {
            soundManager.context.decodeAudioData(request.response, function(buffer){
                clip.buffer = buffer;
                clip.loaded = true;
                callback(clip);
            });
        };
        request.send();
    },
    loadArray: function(array){
        for(var i =0; i< array.length; i++) {
            soundManager.load(array[i],function() {
                if(array.length === Object.keys(soundManager.clips).length) {
                    for(sd in soundManager.clips)
                        if(!soundManager.clips[sd].loaded)
                            return;
                    soundManager.loaded = true;
                }
            });
        }
    },
    play: function(path, settings){
        if(!soundManager.loaded) {
            setTimeout(function() {soundManager.play(path, settings);},1000);
            return;
        }
        var looping = false; 
        var volume = 1;
        if(settings) {
            if(settings.looping)
                looping = settings.looping;
            if(settings.volume)
                volume = settings.volume;   
        }
        var sd = this.clips[path];
        if(sd === null)
            return false;
        var sound = soundManager.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(soundManager.gainNode);
        sound.loop = looping;
        soundManager.gainNode.gain.value = volume;
        sound.start(0);
        return true;
    },
    stopAll: function() {
        this.gainNode.disconnect();
    }
};
var canvas = document.getElementById("canvasId");
var ctx = canvas.getContext("2d"); 
soundManager.init();
soundManager.loadArray(["/mus/aud1.mp3","/mus/aud2.mp3","/mus/aud6.mp3"]);
gameManager.loadAll();
gameManager.play();