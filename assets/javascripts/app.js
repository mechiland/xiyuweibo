(function() {
  var delay, repeat;

  delay = function(ms, func) {
    return setTimeout(func, ms);
  };

  repeat = function(ms, func) {
    return setInterval(func, ms);
  };

  $(function() {
    var _last;
    _last = null;
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
    $(".bo_container").click(function() {
      if (_last !== null) {
        _last.removeClass("selected");
        $('.sub_container').animate({
          "left": "0px"
        }, "fast").hide();
      }
      _last = $(this);
      $(this).addClass("selected");
      return $('.sub_container').show().animate({
        "left": $(this).width() + "px"
      }, "fast");
    });
    $(window).resize(function() {
      return $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
    });
    return $("#btn").click(function() {
      var l;
      macgap.window.open({
        url: "./auth_sina.html",
        width: 640,
        height: 480
      });
      l = macgap.window.open({
        url: "public/auth_sina.html",
        width: 640,
        height: 480
      });
      repeat(1000, function() {
        return console.log(l.url());
      });
      macgap.window.open({
        url: "http://scottjehl.github.com/Respond/test/test.html",
        width: 500,
        height: 400
      });
      delay(1000, function() {
        return macgap.window.resize({
          width: 500,
          height: 300
        });
      });
      return console.log("========" + macgap.window.url());
    });
  });

}).call(this);
