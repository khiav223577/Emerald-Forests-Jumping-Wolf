function createLevelController(BASE_Y){
  var levels = [], difficulty = 0;
  return {
    update: function(player){
      if (levels[0] == undefined){
        (function(){
          difficulty += 1;
          var sx = player.attrs.x + 100;  
          switch(difficulty){
          case 1: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 1)});
            });
            break;}
          case 2: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 2)});
            });
            break;}
          default: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 3)});
            });
            break;}
          }
          levels.push({position: sx + 2000, emyAttrs: []}); //the break time when player change difficulty
        })();
      }
      var level = levels[0];
      if (level && level.position < player.attrs.x + 1000){
        levels.shift();
        var x = level.position;
        _.each(level.emyAttrs, function(attr){
          createMonsterType01(x, BASE_Y, attr, function(character){
            if (character.attrs.x < player.attrs.x) player.damage(99999); //gameover
          });
          x += 80 + Math.rand(50);
        });
      }
    }
  };
}
function createMonsterType01(x, BASE_Y, attr, onUpdate){
  return (function(){
    var character, animator;
    animator = new SpringAnimator(BASE_Y, 20, 0.3, 1600, function(y){ character.attrs.y = y; });
    character = sceneManager.getScene().characterFactory.create(attr.path, {
      attrs: {
        character: {
          race: 2,
          hp: attr.hp,
          atk: attr.atk,
          hitRange: 30
        },
        x: x, 
        y: BASE_Y, 
        scale: 0.5,
        loopPattern: true,
        patternSpeed: 12
      },
      callbacks: {
        getOx: function(s){ return s / 2; },
        getOy: function(s){ return s; },
        onUpdate: function(){
          animator.update();
          if (onUpdate) onUpdate(character);
        }
      }
    });
    ;(function bounce(){
      animator.setVal(BASE_Y + 50 + Math.rand(20)).delay(30 + Math.rand(10), function(){
        animator.setVal(BASE_Y + Math.rand(10)).delay(30 + Math.rand(10), function(){
          bounce();
        });
      });
    })();
    return character;
  })();
}

