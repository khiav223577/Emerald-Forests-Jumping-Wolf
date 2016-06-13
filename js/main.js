function bindResize($canvas){
  var canvas = $canvas[0];
  var canvasRatio = canvas.width / canvas.height;
  var $window = $(window).resize(function(){
    resizeCanvas();
  });
  function resizeCanvas(){
    var width = $window.width();
    var height = $window.height();
    $canvas.css({
      width: Math.floor(height * canvasRatio),
      height: height
    });
  }
  resizeCanvas();
}
$(function(){
  var $canvas = $('#game_canvas');
  var canvas = $canvas[0];
  var ctx = canvas.getContext("2d");
  sceneManager.goto(new MenuScene()); //first scene //TODO game menu scene
  bindResize($canvas);
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
  var character;
  var cd = 0;
  return {
    initialize: function(){
      character = createMonsterType01(650, 80, {path: 'images/characters/monster-02.png'})
    },
    update: function(deltaRatio){
      if (Input.triggered(Input.KEYS.ENTER)){
        //TODO sound && animation?
        sceneManager.goto(new MapScene());
      } 
      if (cd > 0) return (cd -= 1);
      if (Math.rand(20) == 1){
        cd = 10;
        var offX = -650;
        var offY = Math.randBetween(-60, 60);
        character.attrs.x += offX;
        character.attrs.y += offY
        character.shoot('images/characters/magic_ball-0' + String(Math.rand(3) + 1) + '.png');
        character.attrs.x -= offX;
        character.attrs.y -= offY;
      } 
    },
    render1: function(canvas){
      var ctx = canvas.getContext("2d");
      drawImageWithXRepeat(canvas, 0, 0.1, 'images/background.jpg');
      drawImageWithXRepeat(canvas, 0, 1.0, 'images/ground.png');
    },
    render2: function(canvas){
      var ctx = canvas.getContext("2d");
      imageCacher.ifloaded('images/menu/title.png', function(image){
        ctx.drawImage(image, (canvas.width - image.width) / 2, 152 - image.height / 2, image.width, image.height);  
      }, 0.48);
      imageCacher.ifloaded('images/menu/jump.png', function(image){
        ctx.drawImage(image, (canvas.width - image.width) / 2, 324 - image.height / 2, image.width, image.height);  
      }, 0.242);
    }
  };
}
//-------------------------------------
//  MapScene
//-------------------------------------
function MapScene(){
  var VIEWPORT_X = 90; //視角讓狼固定在的X位置
  var BASE_Y = 80;     //地面高度
  var score = 0;
  var thisObj, player, enemyRespawnController;
  var gameover = false;
  return thisObj = {
    initialize: function(){
      player = createPlayer(VIEWPORT_X, BASE_Y, {
        onKilled: function(){
          //TODO pause
        },
        onDestroy: function(){
          gameover = true;
        }
      });
      enemyRespawnController = createLevelController(BASE_Y);
      thisObj.characterFactory.onCharacterKilled = function(){
        score += 10;
      };
    },
    update: function(deltaRatio){
      if (gameover){
        if (Input.triggered(Input.KEYS.ENTER)) sceneManager.goto(new MenuScene());
        return;
      }
      enemyRespawnController.update(player);
    },
    render1: function(canvas){
      var ctx = canvas.getContext("2d");
      var viewX = sceneManager.getScene().viewX = player.attrs.x - VIEWPORT_X;
      drawImageWithXRepeat(canvas, viewX, 0.1, 'images/background.jpg');
      drawImageWithXRepeat(canvas, viewX, 1.0, 'images/ground.png');
    },
    render2: function(canvas){
      var ctx = canvas.getContext("2d");
      ctx.font = "30px Arial";
      ctx.fillText("Score: " + score, 10, 50);
      if (gameover){
        
      }
    }
  };
}








