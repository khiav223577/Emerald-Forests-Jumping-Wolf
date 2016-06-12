Math.rand = function(value){
  return Math.floor(Math.random() * value);
};
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
function FilterableImage(image, width, height, sx, sy){
  var thisObj;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  if (width == undefined) width = image.width;
  if (height == undefined) height = image.height;
  canvas.width = width;
  canvas.height = height;
  if (sx == undefined){
    ctx.drawImage(image, 0, 0, width, height);
  }else{
    ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height);
  }
  var imageData = ctx.getImageData( 0, 0, width, height);
  var changeFlag = false;
  return thisObj = {
    applyFilter: function(filter){
      changeFlag = true;
      var args = [imageData.data];
      for(var i = 1; i < arguments.length; ++i) args.push(arguments[i]);
      filter.apply(this, args);
      return thisObj;
    },
    getCanvas: function(){
      if (changeFlag == true){
        changeFlag = false;
        ctx.putImageData(imageData, 0, 0);
      }
      return canvas;
    }
  };
}
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
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      A: 65,
      D: 68,
      S: 83,
      W: 87
    },
    setKeyStatus: function(key, status){
      statuses[key] = status;
    },
    update: function(){
      _.each(Input.KEYS, function(key){
        if (statuses[key]){
          counter[key] = (counter[key] || 0) + 1;
        }else{
          delete counter[key];
        }
      });
      // console.log(counter); //DEBUG
    },
    pressed: function(key){
      return (getCount(key) > 0);
    },
    triggered: function(key){
      return (getCount(key) == 1);
    }
  };
};
$(function(){
  $(window).keydown(function(e){ 
    // console.log(e.which); //DEBUG
    Input.setKeyStatus(e.which, true); 
  }).keyup(function(e){ 
    Input.setKeyStatus(e.which, false); 
  });
});
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

//-------------------------------------
//  Character
//-------------------------------------
var characterFoctory = new function(){
  var MAX_PATTERNS = {
    "images/characters/wolf.png": 4,
    "images/characters/enemy.png": 4,
    "images/characters/monster-01.png": 1,
    "images/characters/monster-02.png": 1,
    "images/characters/monster-03.png": 1
  };
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; }
  var characters = {}, counter = 0;
  return {
    characters: characters,
    create: function(path, attrs, preUpdateFunc){
      var cid = (counter += 1);
      var isDead = false;
      var pattern = 0, patternCounter = 0, patternAnimeSpeed = 12;
      function dead(){
        isDead = true;
        //TODO 死亡動畫
        destroy();
      }
      function destroy(){
        delete characters[cid];
      }
      var character = {
        attrs: attrs,
        ifLoaded: function(callback){
          imageCacher.ifloaded(path, function(image){
            if (attrs.scale == undefined || attrs.scale == 1){
              callback(image);  
            }else{
              callback(imageCacher.loadBy(path + '=> scaled', function(){ 
                var width = Math.floor(image.width * attrs.scale);
                var height = Math.floor(image.height * attrs.scale);
                return (new FilterableImage(image, width, height).getCanvas()); 
              }));
            }
          });
        },
        getPattern: function(){ return pattern; },
        maxPattern: getMaxPattern(path),
        update: function(){
          if (preUpdateFunc) preUpdateFunc();
          patternCounter += patternAnimeSpeed;
          if (patternCounter > 100){
            patternCounter -= 100;
            pattern = (pattern + 1) % character.maxPattern;
          }
        },
        damage: function(damage){
          attrs.hp -= damage;
          if (attrs.hp < 0 && isDead == false) dead();
        },
      };
      return characters[cid] = character;
    }
  }
}
function NumericSpring(xv, xt, zeta, omega){
  var f = 1.0 + 2.0 * zeta * omega;
  var oo = omega * omega;
  var detInv = 1.0 / (f + oo);
  var detX = f * xv.x + xv.v + oo * xt;
  var detV = xv.v + oo * (xt - xv.x);
  xv.x = detX * detInv;
  xv.v = detV * detInv;
}
function SpringAnimator(defaultVal, updateSpan, zeta, time, onUpdate){
  var thisObj, epsilon = 0.01;
  var xv = {x: defaultVal, v: 0};
  var omega = 2 * Math.PI * updateSpan / time;
  var animator = new AnimateManager();
  var delayCount = 0, delayedArguments = [];
  return thisObj = {
    setVal: function(targetVal, onEnd){
      if (delayCount > 0){ delayedArguments.push(['setVal', arguments]); return thisObj; }
      animator.start(function(){
        if (delayCount > 0){
          delayCount -= 1;
          if (delayCount == 0){
            var tmp = delayedArguments;
            delayedArguments = [];
            _.each(tmp, function(data){ thisObj[data[0]].apply(thisObj, data[1]); });
          }
        }
        var preX = xv.x;
        NumericSpring(xv, targetVal, zeta, omega);
        if (Math.abs(preX - xv.x) < epsilon && Math.abs(targetVal - xv.x) < epsilon){
          xv.x = targetVal;
          xv.v = 0;
          if (onUpdate) onUpdate(targetVal);
          if (onEnd) onEnd();
          return false;
        }
        if (onUpdate) onUpdate(xv.x);
        return true;
      }, updateSpan);
      return thisObj;
    },
    delay: function(time){
      if (delayCount > 0){ delayedArguments.push(['delay', arguments]); return thisObj; }
      delayCount = time;
      return thisObj;
    },
    remove: function(onRemove){
      if (delayCount > 0){ delayedArguments.push(['remove', arguments]); return thisObj; }
      animator.stop();
      if (onRemove) onRemove();
    }
  };
}

