var check, delay, render_status, repeat, side_width, statuses;

delay = function(ms, func) {
  return setTimeout(func, ms);
};

repeat = function(ms, func) {
  return setInterval(func, ms);
};

String.prototype.autoAt = function() {
  var pattern;
  pattern = /(@([^ :]+))/ig;
  return this.replace(pattern, "<a href='http://www.weibo.com/n/$2'>$1</a>");
};

Date.prototype.human = function() {
  return this.format("m月d日 hh:mm");
};

side_width = "400px";

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

statuses = new Statuses;

check = function(w) {
  var pattern, token, url;
  url = w.url();
  pattern = /#access_token=([^&]+)/;
  if (!pattern.test(w.url())) {
    return delay(2000, function() {
      return check(w);
    });
  } else {
    token = w.url().match(pattern)[1];
    return statuses.init(token);
  }
};

render_status = function(s, template) {
  var fn, fullFn;
  if (template == null) template = "#template";
  fn = doT.template($(template).text());
  fullFn = doT.template($(template).text());
  s.text = s.text.autoLink().autoAt();
  return fn(s);
};

$(function() {
  var _last;
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
      if ($(this).css("left") === ("-" + side_width)) {
        s = statuses.get(id);
        s = s.toJSON();
        return $(this).html(render_status(s, "#template_full"));
      }
    });
    return $('.inner').animate({
      "left": "+" + side_width
    }, "fast", function() {
      return $(".inner .anim_block").each(function(el) {
        var new_width, old;
        old = $(this).css("left");
        if (old === "0px") {
          new_width = "-" + side_width;
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
    return statuses.update_latest();
  });
  return $("#btn_login").click(function() {
    var l;
    l = macgap.window.open({
      url: "public/auth_sina.html",
      width: 640,
      height: 480
    });
    return check(l);
  });
});
