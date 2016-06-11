var imageCacher = new function(){
  var onLoadCache = {}, imageCache = {};
  var thisObj;
//-------------------------------------
//  載入圖片
//-------------------------------------
  function loadImage(url, callback){
    var image = imageCache[url];
    if (image == undefined){ //還沒有開始載入圖片
      imageCache[url] = (image = new Image());
      image.crossOrigin = "anonymous"; //use CORS //https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
      onLoadCache[url] = (callback ? [callback] : []);
      image.onload = function(){
        onLoadCache[url].forEach(function(s){ s(image); });
        delete onLoadCache[url];
      };
      image.src = url;
    }else if (onLoadCache[url] == undefined){ //已經開始載入圖片，且已經載入完成了
      if (callback) callback(image);
    }else{ //已經開始載入圖片，但還沒有載入好
      if (callback) onLoadCache[url].push(callback);
    }
  }
  return thisObj = {
    onload: function(url, callback){
      if (url == undefined) return; //missing assets
      if (url.getKey){ //sprite
      	alert('not support');
        //loadSprite(url, callback);
      }else{
        loadImage(url, callback);
      }
    },
    ifloaded: function(url, callback){
      var image = imageCache[url];
      if (image == undefined){
        thisObj.onload(url);
      }else if (onLoadCache[url] == undefined){
        callback(image);
      }
    },
    loadBy: function(url, onMissFunc){
      if (imageCache[url] == undefined) imageCache[url] = onMissFunc();
      return imageCache[url];
    }
  };
};
//-------------------------------------
//  requestAnimFrame
//-------------------------------------
window.requestAnimFrame = function(){
  return (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback){
      window.setTimeout(callback, 1000 / 60);
    }
  );
}();
//-------------------------------------
//  main
//-------------------------------------
$(function(){
  var $canvas = $('#game_canvas')
  var ctx = $canvas[0].getContext("2d");
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(0,0,800,600);
  var renderer = new function(){
  	return {
  		refresh: function(deltaRatio){
				imageCacher.ifloaded('images/background.png', function(image){
					ctx.drawImage(image, 0, 0, image.width, image.height);
				});
  		}
  	}
  };
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
      renderer.refresh(deltaRatio);
    })();
  }(40));
});










