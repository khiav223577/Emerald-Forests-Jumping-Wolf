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
    ifloaded: function(url, callback, scale){
      var image = imageCache[url];
      if (image == undefined){
        thisObj.onload(url);
      }else if (onLoadCache[url] == undefined){
        if (scale && scale != 1){
          image = imageCacher.loadBy(url + '=> scaled: ' + scale.toFixed(2), function(){ 
            var width = Math.floor(image.width * scale);
            var height = Math.floor(image.height * scale);
            return (new FilterableImage(image, width, height).getCanvas()); 
          })
        }
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
  var thisObj, scenes = [];
  return thisObj = {
    push: function(scene){
      scene.viewX = 0;
      scene.characterFoctory = createCharacterFactory();
      scenes.unshift(scene);
      scene.initialize();
    },
    goto: function(scene){
      while(thisObj.pop() != undefined);
      thisObj.push(scene);
    },
    pop: function(){
      var scene = scenes.shift();
      if (scene) scene.characterFoctory.destroy();
      return scene;
    },
    update: function(){
      var scene = scenes[0];
      if (scene){
        scene.update();
        _.each(scene.characterFoctory.characters, function(character){
          character.update();
        });
      } 
    },
    render: function(canvas){
      var scene = scenes[0];
      if (scene){
        scene.render(canvas);
        var ctx = canvas.getContext("2d");
        _.each(scene.characterFoctory.characters, function(character){
          character.ifLoaded(function(image){
            var x = character.attrs.x - scene.viewX;
            var y = canvas.height - character.attrs.y - image.height;
            var sx = character.getPattern() / character.maxPattern * image.width;
            var sy = 0;
            var width = image.width / character.maxPattern;
            var height = image.height;
            ctx.drawImage(image, sx, sy, width, height, x, y, width, height);
          });
        });
      }
    },
    getScene: function(){
      return scenes[0];
    }
  };
}

//-------------------------------------
//  Character
//-------------------------------------
function createCharacterFactory(){
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; } 
  var MAX_PATTERNS = {
    "images/characters/wolf.png": 4,
    "images/characters/enemy.png": 4,
    "images/characters/monster-01.png": 1,
    "images/characters/monster-02.png": 1,
    "images/characters/monster-03.png": 1
  };
  return new function(){
    var characters = {}, counter = 0;
    return {
      characters: characters,
      create: function(path, attrs, preUpdateFunc){
        var cid = (counter += 1);
        var isDead = new FlagObject(false), isDestroyed = new FlagObject(false);
        var pattern = 0, patternCounter = 0, patternAnimeSpeed = 12;
        var character = {
          attrs: attrs,
          ifLoaded: function(callback){
            imageCacher.ifloaded(path, function(image){ callback(image); }, attrs.scale);
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
            if (attrs.hp < 0 && isDead.changeTo(true) == true){
              //TODO 死亡動畫
              character.destroy();
            }
          },
          destroy: function(){
            if (isDestroyed.changeTo(true) == false) return;
            delete characters[cid];
          }
        };
        return characters[cid] = character;
      },
      destroy: function(){
        _.each(characters, function(character){ character.destroy(); });
        characters = undefined;
      }
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
  var animaFunc;
  var delayCount = 0, delayCallback, delayedArguments = [];
  return thisObj = {
    update: function(){
      if (animaFunc == undefined) return;
      if (animaFunc() == false) animaFunc = undefined;
    },
    setVal: function(targetVal, onEnd){
      if (delayCount > 0){ delayedArguments.push(['setVal', arguments]); return thisObj; }
      animaFunc = function(){
        if (delayCount > 0){
          delayCount -= 1;
          if (delayCount == 0){
            var tmp = delayedArguments;
            delayedArguments = [];
            _.each(tmp, function(data){ thisObj[data[0]].apply(thisObj, data[1]); });
            delayCallback();
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
      };
      return thisObj;
    },
    delay: function(time, callback){
      if (delayCount > 0){ delayedArguments.push(['delay', arguments]); return thisObj; }
      delayCount = time;
      delayCallback = callback;
      return thisObj;
    },
    remove: function(onRemove){
      if (delayCount > 0){ delayedArguments.push(['remove', arguments]); return thisObj; }
      if (onRemove) onRemove();
    }
  };
}
function drawImageWithXRepeat(canvas, viewX, ratio, path){
  var ctx = canvas.getContext("2d");
  imageCacher.ifloaded(path, function(image){
    var width = image.width * (canvas.height / image.height);
    var dx = -(viewX * ratio) % width;
    if (dx > 0) dx -= width;
    while(dx < canvas.width){
      ctx.drawImage(image, dx, 0, width, canvas.height);  
      dx += width;
    }
  });
}
function FlagObject(flag){
  var thisObj, prevFlag;
  return thisObj = {
    changeTo: function(newFlag){ //回傳flag有沒有變
      if (newFlag == flag) return false;
      prevFlag = flag;
      flag = newFlag;
      return true;
    },
    toggle: function(newFlag){
      thisObj.changeTo(newFlag != undefined ? newFlag : !flag);
      return thisObj.val();
    },
    is: function(checkFlag){
      return (flag == checkFlag);
    },
    val: function(){
      return flag;
    },
    prevVal: function(){
      return prevFlag;
    }
  };
}
