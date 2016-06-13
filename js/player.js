function LinearPerRatioModel(minRatio, perX){
  var start, target, epsilon = 0.01;
  return {
    setStartAttrs: function(_current, _target){
      if (target == _target) return;
      target = _target;
      start = _current;
    },
    getNextValue: function(current){
    //start    current             target
    //|-----------|------------------|
      var max = target - start + 0.0;
      var val = target - current;
      if (max == 0) return target;
      var per = val / max;
      var change = val * (minRatio + (1 - per) / perX);
      if (Math.abs(change) < epsilon) return current;
      return current + change;
    }
  };
}

function createPPBar(x, y, min, max, currentVal){
  var targetVal, animator = new LinearPerRatioModel(0.1, 4);
  var blood = sceneManager.getScene().spriteFactory.create('images/bar/blood.png', {
    attrs: {x: x + 6, y: y - 3, scale: 1, patternSpeed: 0, loopPattern: true, fixedPosition: true },
    callbacks: {
      getOx: function(s){ return 0; },
      getOy: function(s){ return 0; },
      onUpdate: function(){
        if (currentVal == targetVal) return;
        setCurrentVal(animator.getNextValue(currentVal));
      }
    }
  });
  var outlayer = sceneManager.getScene().spriteFactory.create('images/bar/outlayer.png', {
    attrs: {x: x, y: y, scale: 1, patternSpeed: 0, loopPattern: true, fixedPosition: true },
    callbacks: {
      getOx: function(s){ return 0; },
      getOy: function(s){ return 0; },
      onUpdate: function(){}
    }
  });
  function setValue(val){
    val = Math.max(Math.min(val, max), min);
    targetVal = val;
    if (currentVal == undefined) setCurrentVal(targetVal);
    if (currentVal != targetVal) animator.setStartAttrs(currentVal, targetVal);
  }
  function setCurrentVal(val){
    currentVal = val;
    blood.attrs.ratio = (currentVal - min) / (max - min);
  }
  setValue(currentVal == undefined ? min : currentVal);
  return {
    setValue: setValue,
    getCurrentValue: function(){ return currentVal; },
    destroy: function(){
      blood.destroy();
      outlayer.destroy();
      blood = undefined;
      outlayer = undefined;
    }
  }
}
function createPlayer(VIEWPORT_X, BASE_Y, callbacks){
  var player, vx = 0, vy = 0;
  var currentStatus, STATUSES = {};
  function changeStatus(status){
    if (currentStatus) currentStatus.onLeft();
    currentStatus = status;
    status.initialize();
  }
  IDLE_PATH = 'images/characters/wolf.png';
  JUMP_PATH = 'images/characters/wolf_jump.png';
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
        if (Input.pressed(Input.KEYS.UP) && character.attrs.y == BASE_Y){
          player.setPath(JUMP_PATH);
          vy = 15;
        } 
      },
      update: function(character){
        if (character.attrs.y > BASE_Y) vy -= 1; //gravity
      },
      onLeft: function(){

      }
    };
  };
  STATUSES.SING = new function(){
    var singCounter, ppbar;
    return {
      initialize: function(){
        ppbar = createPPBar(100, 300, 0, 80);
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
        if (Input.pressed(Input.KEYS.A)){ ppbar.setValue(45); }
        if (Input.pressed(Input.KEYS.S)){ ppbar.setValue(55); }
        if (Input.pressed(Input.KEYS.D)){ ppbar.setValue(65); }
      },
      update: function(character){
        if ((singCounter -= 1) < 0){
          var val = ppbar.getCurrentValue();
          if (val >= 40 && val < 50) character.shoot('images/characters/magic_ball-01.png', 'water' );
          if (val >= 50 && val < 60) character.shoot('images/characters/magic_ball-02.png', 'fire'  );
          if (val >= 60 && val < 70) character.shoot('images/characters/magic_ball-03.png', 'ground');
          return changeStatus(STATUSES.IDLE);
        }
        vy *= 0.9;
      },
      onLeft: function(){
        ppbar.destroy();
        ppbar = undefined;
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
          player.setPath(IDLE_PATH);
        }
      }
    }
  });
  changeStatus(STATUSES.IDLE);
  return player;
}
