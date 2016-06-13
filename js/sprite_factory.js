var assetsManager = new function(){
  var MAX_PATTERNS = {
    "images/characters/wolf.png": 2,
    "images/characters/wolf_jump.png": 1,
    "images/characters/wolf_stand.png": 1,
    "images/characters/monster-01.png": 1,
    "images/characters/monster-02.png": 1,
    "images/characters/monster-03.png": 1,
    "images/characters/sing_effect.png": 15
  };
  var preloadFlag = new FlagObject(false);
  return {
    getMaxPattern: function(path){ return MAX_PATTERNS[path] || 1; },
    preload: function(){
      if (preloadFlag.changeTo(true) == false) return;
      _.each(MAX_PATTERNS, function(_, path){ imageCacher.onload(path); }); //preload  
    }
  };
};
function createSpriteFactory(){
  return new function(){
    var characters = {}, counter = 0;
    return {
      eachCharacter: function(callback){
        _.each(characters, function(character){ if (character) callback(character); }); //character may be destroyed in this loop
      },
      create: function(_path, options){ //options = {attrs: ?, callbacks: ?}; attrs = {x: ?, y: ?, scale: ?, patternSpeed: 12}
        var cid = (counter += 1);
        var isDestroyed = new FlagObject(false);
        var path, pattern, patternCounter = 0;
        var attrs = options.attrs;
        var callbacks = options.callbacks || {};
        var character = {
          attrs: attrs,
          setPath: function(_path){
            path = _path;
            character.image = undefined;
            pattern = 0;
            character.maxPattern = assetsManager.getMaxPattern(path);
            imageCacher.onload(path, function(image){ character.image = image; }, attrs.scale);
          },
          getOx: function(){ return callbacks.getOx(character.image.width / character.maxPattern); },
          getOy: function(){ return callbacks.getOy(character.image.height); },
          ifLoaded: function(callback){
            imageCacher.ifloaded(path, function(image){ callback(image); }, attrs.scale);
          },
          getPattern: function(){ return pattern; },
          update: function(){
            if (callbacks.onUpdate) callbacks.onUpdate();
            if (character.maxPattern){
              patternCounter += attrs.patternSpeed;
              if (patternCounter > 100){
                patternCounter -= 100;
                pattern += 1;
                if (pattern >= character.maxPattern){
                  if (attrs.loopPattern) pattern = 0;
                  else character.destroy();
                } 
              }  
            }
          },
          destroy: function(){
            if (isDestroyed.changeTo(true) == false) return;
            if (attrs.onDestroy) attrs.onDestroy();
            delete characters[cid];
          }
        };
        character.setPath(_path);
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
    create: function(path, options){  //attrs = {x: ?, y: ?, scale: ?, character: {atk: ?, hp: ?, race: ?, hitRange: ?}}
      var attrs = options.attrs;
      var character = spriteFactory.create(path, options);
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
            attrs: {
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
              loopPattern: true,
              patternSpeed: 12
            }, 
            callbacks: {
              getOx: function(s){ return s / 2; },
              getOy: function(s){ return s; },
              onUpdate: function(){

              }
            }
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
    create: function(path, options){  //attrs = {x: ?, y: ?, scale: ?, bullet: {atk: ?, hp: ?, speed: ?, existTime: ?, race: ?, hitRange: ?}}
      var bullet, preOnUpdate = options.callbacks.onUpdate, attrs = options.attrs;
      options.callbacks.onUpdate = function(){
        if (preOnUpdate) preOnUpdate();
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
      }
      return (bullet = spriteFactory.create(path, options));
    }
  }
}




