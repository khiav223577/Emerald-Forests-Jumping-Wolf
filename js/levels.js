function createLevelController(BASE_Y){
  var levels = [], difficulty = 0;
  return {
    update: function(player){
      if (levels[0] == undefined){
        (function(){
          difficulty += 1;
          var sx = player.attrs.x + 100;
          var emys = [
            {hp: 100, atk: 100, path: 'images/characters/monster-01.png', element: 'water' },
            {hp: 100, atk: 100, path: 'images/characters/monster-02.png', element: 'fire'  },
            {hp: 100, atk: 100, path: 'images/characters/monster-03.png', element: 'ground'},
          ];  
          switch(difficulty){
          case 1: {
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 1)});
            });
            break;}
          case 2: {
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 2)});
            });
            break;}
          default: {
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 3)});
            });
            break;}
          }
          levels.push({position: sx + 1200, emyAttrs: []}); //the break time when player change difficulty
        })();
      }
      var level = levels[0];
      if (level && level.position < player.attrs.x + 1000){
        levels.shift();
        var x = level.position;
        _.each(level.emyAttrs, function(characterAttr){
          createMonsterType01(x, BASE_Y, characterAttr, function(character){
            if (character.attrs.x < player.attrs.x) player.damage(99999); //gameover
          });
          x += 80 + Math.rand(50);
        });
      }
    }
  };
}
function createMonsterType01(x, BASE_Y, characterAttr, onUpdate){
  return (function(){
    var character, animator;
    animator = new SpringAnimator(BASE_Y, 20, 0.3, 1600, function(y){ character.attrs.y = y; });
    character = sceneManager.getScene().characterFactory.create(characterAttr.path, {
      attrs: {
        character: {
          element: characterAttr.element,
          race: 2,
          hp: characterAttr.hp,
          atk: characterAttr.atk,
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

