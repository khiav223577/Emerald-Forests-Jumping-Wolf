function createPlayer(VIEWPORT_X, BASE_Y, callbacks){
  var vx = 0, vy = 0;
  var currentStatus, STATUSES = {};
  function changeStatus(status){
    currentStatus = status;
    status.initialize();
  }
  STATUSES.IDLE = new function(){
    return {
      initialize: function(){

      },
      updateInput: function(character){
        if (Input.pressed(Input.KEYS.SPACE)) return changeStatus(STATUSES.SING);
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
    var minVy = -2;
    var animator;
    return {
      initialize: function(){
        animator = new SpringAnimator(6, 20, 0.6, 1600, function(y){ vy = y; });
        animator.setVal(-6);
        animator.update();
      },
      updateInput: function(character){
        if (Input.pressed(Input.KEYS.A)){ character.shoot('images/characters/magic_ball-01.png'); changeStatus(STATUSES.IDLE); }
        if (Input.pressed(Input.KEYS.S)){ character.shoot('images/characters/magic_ball-02.png'); changeStatus(STATUSES.IDLE); }
        if (Input.pressed(Input.KEYS.D)){ character.shoot('images/characters/magic_ball-03.png'); changeStatus(STATUSES.IDLE); }
      },
      update: function(character){
        if (character.attrs.y > BASE_Y) animator.update();
        else{
          animator = undefined;
          changeStatus(STATUSES.IDLE);
        }
      }
    };
  };
  changeStatus(STATUSES.IDLE);
  var player = sceneManager.getScene().characterFactory.create('images/characters/wolf.png', {
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
    scale: 0.5
  }, function(){
    currentStatus.updateInput(player);
    currentStatus.update(player);
    player.attrs.x += vx;
    player.attrs.y += vy;
    if (player.attrs.y < BASE_Y){
      player.attrs.y = BASE_Y;
      vy = 0;
    }
  });
  return player;
}
