function createPlayer(VIEWPORT_X, BASE_Y){
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
      updateInput: function(){
        if (Input.pressed(Input.KEYS.SPACE)) return changeStatus(STATUSES.SING);
      	if (Input.pressed(Input.KEYS.RIGHT)) vx = 6;
		    else if (Input.pressed(Input.KEYS.LEFT)) vx = 3;
		    else vx = 4;
        if (Input.pressed(Input.KEYS.UP) && player.attrs.y == BASE_Y) vy = 15;
      },
      update: function(){
      	if (player.attrs.y > BASE_Y) vy -= 1; //gravity
      }
    };
  };
  STATUSES.SING = new function(){
    function shoot(path){
      changeStatus(STATUSES.IDLE);
      sceneManager.getScene().bulletFactory.create(path, {
        existTime: 100,
        speed: 20,
        x: player.attrs.x,
        y: player.attrs.y,
        atk: player.attrs.atk,
        hp: 1
      });
    }
    var minVy = -2;
    var animator;
    return {
    	initialize: function(){
				animator = new SpringAnimator(6, 20, 0.6, 1600, function(y){ vy = y; });
				animator.setVal(-6);
				animator.update();
    	},
      updateInput: function(){
        if (Input.pressed(Input.KEYS.A)) shoot('images/characters/magic_ball-01.png');
        if (Input.pressed(Input.KEYS.S)) shoot('images/characters/magic_ball-02.png');
        if (Input.pressed(Input.KEYS.D)) shoot('images/characters/magic_ball-03.png');
      },
      update: function(){
      	if (player.attrs.y > BASE_Y) animator.update();
      	else{
      		animator = undefined;
      		changeStatus(STATUSES.IDLE);
      	}
      }
    };
  };
  changeStatus(STATUSES.IDLE);
  var player = sceneManager.getScene().characterFactory.create('images/characters/wolf.png', {
    x: VIEWPORT_X, 
    y: BASE_Y,
    hp: 100,
    atk: 100
  }, function(){
    currentStatus.updateInput();
    currentStatus.update();
    player.attrs.x += vx;
    player.attrs.y += vy;
    if (player.attrs.y < BASE_Y){
      player.attrs.y = BASE_Y;
      vy = 0;
    }
  });
  return player;
}
