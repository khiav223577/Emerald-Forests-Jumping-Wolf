function createSpriteFactory(){
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
      create: function(path, attrs, preUpdateFunc){ //attrs = {x: ?, y: ?, scale: ?}
        var cid = (counter += 1);
        var isDestroyed = new FlagObject(false);
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
function createCharacterFactory(spriteFactory){
  var isDead = new FlagObject(false);
  var bulletFactory = createBulletFactory(spriteFactory);
  return {
    create: function(path, attrs, preUpdateFunc){  //attrs = {x: ?, y: ?, scale: ?, character: {atk: ?, hp: ?, race: ?}}
      var character = spriteFactory.create(path, attrs, preUpdateFunc);
      _.merge(character, {
        damage: function(damage){
          attrs.character.hp -= damage;
          if (attrs.character.hp < 0 && isDead.changeTo(true) == true){
            //TODO 死亡動畫
            character.destroy();
          }
        },
        shoot: function(path){
          bulletFactory.create(path, {
            bullet: {
              existTime: 100,
              speed: 20,
              race: character.attrs.race
            },
            x: character.attrs.x,
            y: character.attrs.y,
            atk: character.attrs.atk,
            hp: 1
          });
        }
      });
      return character;
    }
  };
}
//-------------------------------------
//  Bullet
//-------------------------------------
function createBulletFactory(spriteFactory){
  return {
    create: function(path, attrs){  //attrs = {x: ?, y: ?, scale: ?, atk: ?, hp: ?, bullet: {speed: ?, existTime: ?, race: ?}}
      var character = spriteFactory.create(path, attrs, function(){ //attrs = {x: ?, y: ?, atk: ?, hp: ?}
        if ((attrs.bullet.existTime -= 1) < 0) return character.destroy(); //TODO 子彈消失動畫
        character.attrs.x += attrs.bullet.speed;
        // _.each(spriteFactory.characters, function(other){
        //   if (other.attrs.character == undefined) return; //bullet can only hit character
        //   var offx = other.attrs.x - character.attrs.x;
        //   var offy = other.attrs.y - character.attrs.y;
        //   // if (Math.sqrt(offx * offx + offy * offy) < )
        // });
      });
      return character;
    }
  }
}




