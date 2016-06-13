function createSpriteFactory(){
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; } 
  var MAX_PATTERNS = {
    "images/characters/wolf.png": 1,
    "images/characters/enemy.png": 4,
    "images/characters/monster-01.png": 1,
    "images/characters/monster-02.png": 1,
    "images/characters/monster-03.png": 1,
    "images/characters/sing_effect.png": 15
  };
  return new function(){
    var characters = {}, counter = 0;
    return {
      eachCharacter: function(callback){
        _.each(characters, function(character){ if (character) callback(character); }); //character may be destroyed in this loop
      },
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
            if (attrs.onDestroy) attrs.onDestroy();
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
  var thisObj, bulletFactory = createBulletFactory(spriteFactory);
  return thisObj = {
    create: function(path, attrs, preUpdateFunc){  //attrs = {x: ?, y: ?, scale: ?, character: {atk: ?, hp: ?, race: ?, hitRange: ?}}
      var character = spriteFactory.create(path, attrs, preUpdateFunc);
      var isDead = new FlagObject(false);
      _.merge(character, {
        damage: function(damage){
          if (attrs.onDamaged) attrs.onDamaged(damage);
          attrs.character.hp -= damage;
          if (attrs.character.hp <= 0 && isDead.changeTo(true) == true){
            if (attrs.onKilled) attrs.onKilled();
            if (thisObj.onCharacterKilled) thisObj.onCharacterKilled(character);
            character.destroy(); //TODO 死亡動畫
          }
        },
        shoot: function(path){
          bulletFactory.create(path, {
            bullet: {
              atk: character.attrs.character.atk,
              hp: 1,
              existTime: 100,
              speed: 20,
              race: character.attrs.character.race,
              hitRange: 50
            },
            x: character.attrs.x,
            y: character.attrs.y,
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
    create: function(path, attrs){  //attrs = {x: ?, y: ?, scale: ?, bullet: {atk: ?, hp: ?, speed: ?, existTime: ?, race: ?, hitRange: ?}}
      var bullet = spriteFactory.create(path, attrs, function(){ //attrs = {x: ?, y: ?, atk: ?, hp: ?}
        if ((attrs.bullet.existTime -= 1) < 0) return bullet.destroy(); //TODO 子彈消失動畫
        bullet.attrs.x += attrs.bullet.speed;
        spriteFactory.eachCharacter(function(other){
          if (other.attrs.character == undefined) return; //bullet can only hit character
          if (other.attrs.character.race == bullet.attrs.bullet.race) return; //can only hit different race
          var offx = other.attrs.x - bullet.attrs.x;
          var offy = other.attrs.y - bullet.attrs.y;
          if (Math.sqrt(offx * offx + offy * offy) <= bullet.attrs.bullet.hitRange + other.attrs.character.hitRange){
            other.damage(bullet.attrs.bullet.atk);
            bullet.destroy();
          }
        });
      });
      return bullet;
    }
  }
}




