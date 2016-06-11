var imageCacher = new function(){
  var onLoadCache = {}, imageCache = {};
  var thisObj;
//-------------------------------------
//  載入圖片
//-------------------------------------
  function loadImage(url, callback){
    var image = imageCache[url];
    if (image == undefined){ //還沒有開始載入圖片
      imageCache[url] = (image = new Image());
      image.crossOrigin = "anonymous"; //use CORS //https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
      onLoadCache[url] = (callback ? [callback] : []);
      image.onload = function(){
        onLoadCache[url].forEach(function(s){ s(image); });
        delete onLoadCache[url];
      };
      image.src = url;
    }else if (onLoadCache[url] == undefined){ //已經開始載入圖片，且已經載入完成了
      if (callback) callback(image);
    }else{ //已經開始載入圖片，但還沒有載入好
      if (callback) onLoadCache[url].push(callback);
    }
  }
  return thisObj = {
    onload: function(url, callback){
      if (url == undefined) return; //missing assets
      if (url.getKey){ //sprite
        alert('not support');
        //loadSprite(url, callback);
      }else{
        loadImage(url, callback);
      }
    },
    ifloaded: function(url, callback){
      var image = imageCache[url];
      if (image == undefined){
        thisObj.onload(url);
      }else if (onLoadCache[url] == undefined){
        callback(image);
      }
    },
    loadBy: function(url, onMissFunc){
      if (imageCache[url] == undefined) imageCache[url] = onMissFunc();
      return imageCache[url];
    }
  };
};
//-------------------------------------
//  requestAnimFrame
//-------------------------------------
window.requestAnimFrame = function(){
  return (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback){
      window.setTimeout(callback, 1000 / 60);
    }
  );
}();
//-------------------------------------
//  main
//-------------------------------------
var Input = new function(){
  var statuses = {}, counter = {};
  function getCount(key){
    var count = counter[key];
    return (count == undefined ? 0 : count);
  }
  return {
    KEYS: {
      ENTER: 13,
      SPACE: 32
    },
    onKeyPressed: function(key){
      statuses[key] = true;
    },
    update: function(){
      _.each(Input.KEYS, function(key){
        if (statuses[key]){
          counter[key] = (counter[key] || 0) + 1;
        }else{
          delete counter[key];
        }
      });
      statuses = {};
      //console.log(counter); //DEBUG
    },
    pressed: function(key){
      return (getCount(key) > 0);
    },
    triggered: function(key){
      return (getCount(key) == 1);
    }
  };
};
var sceneManager = new function(){
  var scenes = [];
  return {
    goto: function(scene){
      scenes.unshift(scene);
    },
    back: function(){
      return scenes.shift();
    },
    update: function(){
      var scene = scenes[0];
      if (scene) scene.update();
    },
    render: function(canvas){
      var scene = scenes[0];
      if (scene) scene.render(canvas);
    }
  };
}
$(function(){
  $(window).keypress(function(e){ Input.onKeyPressed(e.which) });
  var canvas = $('#game_canvas')[0];
  var ctx = canvas.getContext("2d");
  sceneManager.goto(new MenuScene()); //first scene //TODO game menu scene
  ;(function(fps){
    var interval = 1000 / fps;
    var prevTime = Date.now();
    ;(function loop(){
      window.requestAnimFrame(loop);
      var now = Date.now();
      var delta = now - prevTime;
      if (delta < interval) return;
      var deltaRatio = delta / interval; //經過的時間與預計的時間的比例。數字越高代表越LAG。
      prevTime += delta - (delta % interval); //若requestAnimFrame是60FPS時，delta會是16ms的倍數。要減掉delta % interval否則會多算時間。
      Input.update();
      sceneManager.update(deltaRatio);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sceneManager.render(canvas);
    })();
  }(40));
});
//-------------------------------------
//  MenuScene
//-------------------------------------
function MenuScene(){
  return {
    update: function(deltaRatio){
      if (Input.pressed(Input.KEYS.ENTER)){
        //TODO sound && animation?
        sceneManager.goto(new MapScene());
      } 
    },
    render: function(canvas){
      var ctx = canvas.getContext("2d");
      imageCacher.ifloaded('images/menu.jpg', function(image){
        var width = image.width * (canvas.height / image.height);
        ctx.drawImage(image, (canvas.width - width) / 2, 0, width, canvas.height);  
      });
    }
  };
}
//-------------------------------------
//  MapScene
//-------------------------------------
function MapScene(){
  var player = characterFoctory.create('images/wolf.png', 0, 80);
  return {
    update: function(deltaRatio){
      player.x += 5; //keep running
      _.each(characterFoctory.characters, function(character){
        character.update();
      });
    },
    render: function(canvas){
      var ctx = canvas.getContext("2d");
      imageCacher.ifloaded('images/background.jpg', function(image){
        var ratio = 0.1;
        var width = image.width * (canvas.height / image.height);
        var dx = -(player.x * ratio) % width;
        while(dx < canvas.width){
          ctx.drawImage(image, dx, 0, width, canvas.height);  
          dx += width;
        }
      });
      imageCacher.ifloaded('images/ground.png', function(image){
        var width = image.width * (canvas.height / image.height);
        var dx = -player.x % width;
        while(dx < canvas.width){
          ctx.drawImage(image, dx, 0, width, canvas.height);  
          dx += width;
        }
      });
      _.each(characterFoctory.characters, function(character){
        imageCacher.ifloaded(character.path, function(image){
          var x = character.x - player.x;
          var y = canvas.height - character.y - image.height;
          var sx = character.getPattern() / character.maxPattern * image.width;
          var sy = 0;
          var width = image.width / character.maxPattern;
          var height = image.height;
          ctx.drawImage(image, sx, sy, width, height, x, y, width, height);
        });
      });
    }
  };
}
//-------------------------------------
//  Character
//-------------------------------------
var characterFoctory = new function(){
  var MAX_PATTERNS = {
    "images/wolf.png": 4
  };
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; }
  var characters = {}, counter = 0;
  return {
    characters: characters,
    create: function(path, x, y){
      var cid = (counter += 1);
      var pattern = 0, patternCounter = 0, patternAnimeSpeed = 12;
      var character = {
        x: x,
        y: y,
        path: path,
        getPattern: function(){ return pattern; },
        maxPattern: getMaxPattern(path),
        update: function(){
          patternCounter += patternAnimeSpeed;
          if (patternCounter > 100){
            patternCounter -= 100;
            pattern = (pattern + 1) % character.maxPattern;
          }
        },
        destroy: function(){
          delete characters[cid];
        }
      };
      return characters[cid] = character;
    }
  }
}









