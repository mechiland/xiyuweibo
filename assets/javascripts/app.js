var check, delay, render_status, repeat;

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

check = function(w) {
  var fn, pattern, token, url;
  url = w.url();
  pattern = /#access_token=([^&]+)/;
  if (!pattern.test(w.url())) {
    return delay(2000, function() {
      return check(w);
    });
  } else {
    token = w.url().match(pattern)[1];
    url = "https://api.weibo.com/2/statuses/home_timeline.json?access_token=" + token;
    fn = doT.template($("#template").text());
    return $.getJSON(url, function(data) {
      var s, text, _i, _len, _ref, _results;
      console.log(data["statuses"].length);
      _ref = data["statuses"].reverse();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        s.text = s.text.autoLink();
        text = fn(s);
        _results.push($(".bo_list").prepend(text));
      }
      return _results;
    });
  }
};

render_status = function(s, template) {
  var fn, fullFn;
  if (template == null) template = "#template";
  fn = doT.template($(template).text());
  fullFn = doT.template($(template).text());
  s.text = s.text.autoLink();
  return fn(s);
};

$(function() {
  var statuses, _last;
  statuses = new Statuses;
  statuses.on("add", function(s) {
    s = s.toJSON();
    return $(".bo_list").prepend(render_status(s));
  });
  _last = null;
  $(".main, .side").attr("style", "height: " + (window.innerHeight - 36) + "px");
  $(document).on("click", ".main .bo_container", function() {
    var id;
    if (_last !== null) {
      if (_last.attr("id") === $(this).attr("id")) return;
      _last.removeClass("selected");
    }
    $(this).addClass("selected");
    _last = $(this);
    id = $(this).attr("data-id");
    $(".inner .anim_block").each(function() {
      var s;
      if ($(this).css("left") === "-400px") {
        s = statuses.get(id);
        s = s.toJSON();
        return $(this).html(render_status(s, "#template_full"));
      }
    });
    return $('.inner').animate({
      "left": "+400px"
    }, "slow", function() {
      return $(".inner .anim_block").each(function(el) {
        var new_width, old;
        old = $(this).css("left");
        if (old === "0px") {
          new_width = "-400px";
        } else {
          new_width = "0px";
        }
        $(this).css("left", new_width);
        return $(".inner").css("left", "0px");
      });
    });
  });
  $(document).on("click", ".single_bo .content a", function() {
    macgap.app.open($(this).attr("href"));
    return false;
  });
  $(window).resize(function() {
    return $(".main, .side").attr("style", "height: " + (window.innerHeight - 36) + "px");
  });
  $("#btn_fetch").click(function() {
    var url;
    url = "";
    if (typeof magcap !== 'undefined') url = "public/";
    return $.getJSON("" + url + "home_timeline.json", function(data) {
      return statuses.add(data["statuses"].reverse());
    });
  });
  return $("#btn_login").click(function() {
    var l;
    l = macgap.window.open({
      url: "auth_sina.html",
      width: 640,
      height: 480
    });
    return check(l);
  });
});
