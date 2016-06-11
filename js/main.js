$(function(){
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
  var player = characterFoctory.create('images/characters/wolf.png', 0, 80, function(){
    if (Input.pressed(Input.KEYS.RIGHT)) player.x += 5;
    // if (Input.pressed(Input.KEYS.SPACE)) player.jump();
  });
  var enemy;
  return {
    update: function(deltaRatio){
      // 
      if (player.x % 1200 == 50){ 
        if (enemy) enemy.destroy();
        enemy = characterFoctory.create('images/characters/enemy.png', player.x + 1000, 80);
      }
      _.each(characterFoctory.characters, function(character){
        character.update();
      });
    },
    render: function(canvas){
      var ctx = canvas.getContext("2d");
      var viewX = player.x - 80;
      function drawImageWithXRepeat(ratio, path){
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
      drawImageWithXRepeat(0.1, 'images/background.jpg');
      drawImageWithXRepeat(1.0, 'images/ground.png');
      _.each(characterFoctory.characters, function(character){
        imageCacher.ifloaded(character.path, function(image){
          var x = character.x - viewX;
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
    "images/characters/wolf.png": 4,
    "images/characters/enemy.png": 4
  };
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; }
  var characters = {}, counter = 0;
  return {
    characters: characters,
    create: function(path, x, y, preUpdateFunc){
      var cid = (counter += 1);
      var pattern = 0, patternCounter = 0, patternAnimeSpeed = 12;
      var character = {
        x: x,
        y: y,
        path: path,
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
        destroy: function(){
          delete characters[cid];
        }
      };
      return characters[cid] = character;
    }
  }
}









