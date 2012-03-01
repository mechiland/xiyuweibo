(function() {
  var delay, repeat;

  delay = function(ms, func) {
    return setTimeout(func, ms);
  };

  repeat = function(ms, func) {
    return setInterval(func, ms);
  };

  $(function() {
    ($(".container")).attr("style", "height: " + (window.innerHeight - 36) + "px");
    return $(window).resize(function() {
      console.log(window.innerHeight);
      $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
      console.log("Its ready");
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
  });

}).call(this);
