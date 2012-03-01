(function() {
  var delay, repeat;

  delay = function(ms, func) {
    return setTimeout(func, ms);
  };

  repeat = function(ms, func) {
    return setInterval(func, ms);
  };

  doT.templateSettings = {
    evaluate: /\[\[([\s\S]+?)\]\]/g,
    interpolate: /\[\[=([\s\S]+?)\]\]/g,
    encode: /\[\[!([\s\S]+?)\]\]/g,
    use: /\[\[#([\s\S]+?)\]\]/g,
    define: /\]\]##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
    varname: 'it',
    strip: true,
    append: true
  };

  $(function() {
    var _last;
    _last = null;
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
    $(document).on("click", ".bo_container", function() {
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
    $("#btn_fetch").click(function() {
      var fn;
      fn = doT.template($("#template").text());
      return $.getJSON("statuses.json", function(data) {
        var s, text, _i, _len, _ref, _results;
        _ref = data["statuses"];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          text = fn(s);
          _results.push($(".bo_list").prepend(text));
        }
        return _results;
      });
    });
    return $("#btn_login").click(function() {
      var l;
      l = macgap.window.open({
        url: "public/auth_sina.html",
        width: 640,
        height: 480
      });
      return $.get("http://www.google.com", function(data) {
        return console.log(data);
      });
    });
  });

}).call(this);
