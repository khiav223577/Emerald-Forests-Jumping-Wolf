function createPlayer(VIEWPORT_X, BASE_Y, callbacks){
  var player, vx = 0, vy = 0;
  var currentStatus, STATUSES = {};
  function changeStatus(status){
    currentStatus = status;
    status.initialize();
  }
  IDLE_PATH = 'images/characters/wolf.png';
  JUMP_PATH = 'images/characters/wolf_jump.png';
  imageCacher.onload(IDLE_PATH);
  imageCacher.onload(JUMP_PATH); //preload
  STATUSES.IDLE = new function(){
    var singCD = 0;
    return {
      initialize: function(){
        player.setPath(IDLE_PATH);
      },
      updateInput: function(character){
        if (singCD > 0) singCD -= 1;
        if (Input.pressed(Input.KEYS.SPACE) && singCD == 0){ 
          singCD = 15;
          return changeStatus(STATUSES.SING);
        }
        if (Input.pressed(Input.KEYS.RIGHT)) vx = 6;
        else if (Input.pressed(Input.KEYS.LEFT)) vx = 3;
        else vx = 4;
        if (Input.pressed(Input.KEYS.UP) && character.attrs.y == BASE_Y) vy = 15;
      },
      update: function(character){
        if (character.attrs.y > BASE_Y) vy -= 1; //gravity
      }
    };
  };
  STATUSES.SING = new function(){
    var singCounter;
    return {
      initialize: function(){
        player.setPath(JUMP_PATH);
        singCounter = 30;
        var singEffect = sceneManager.getScene().spriteFactory.create('images/characters/sing_effect.png', {
          attrs: {
            x: 0,
            y: 0,
            scale: 4,
            loopPattern: false,
            patternSpeed: 50  
          },
          callbacks: {
            getOx: function(s){ return s / 2; },
            getOy: function(s){ return s / 2; },
            onUpdate: function(){
              singEffect.attrs.x = player.attrs.x;
              singEffect.attrs.y = player.attrs.y + 20;
            }
          }
        });
        vy = 6;
      },
      updateInput: function(character){
        if (Input.pressed(Input.KEYS.A)){ character.shoot('images/characters/magic_ball-01.png'); changeStatus(STATUSES.IDLE); }
        if (Input.pressed(Input.KEYS.S)){ character.shoot('images/characters/magic_ball-02.png'); changeStatus(STATUSES.IDLE); }
        if (Input.pressed(Input.KEYS.D)){ character.shoot('images/characters/magic_ball-03.png'); changeStatus(STATUSES.IDLE); }
      },
      update: function(character){
        if ((singCounter -= 1) < 0) return changeStatus(STATUSES.IDLE);
        vy *= 0.9;
      }
    };
  };
  player = sceneManager.getScene().characterFactory.create('images/characters/wolf.png', {
    attrs: {
      character: {
        race: 1,
        hp: 100,
        atk: 100,
        hitRange: 3 //not using
      },
      onKilled: callbacks.onKilled,
      onDestroy: callbacks.onDestroy,
      x: VIEWPORT_X, 
      y: BASE_Y,
      scale: 0.5,
      loopPattern: true,
      patternSpeed: 12
    },
    callbacks: {
      getOx: function(s){ return s / 2; },
      getOy: function(s){ return s; },
      onUpdate: function(){
        if (player.image){ //allow control after image loaded
          currentStatus.updateInput(player);
          currentStatus.update(player);  
        }
        player.attrs.x += vx;
        player.attrs.y += vy;
        if (player.attrs.y < BASE_Y){
          player.attrs.y = BASE_Y;
          vy = 0;
        }
      }
    }
  });
  changeStatus(STATUSES.IDLE);
  return player;
}
