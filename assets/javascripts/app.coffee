delay = (ms, func) -> setTimeout func, ms
repeat = (ms, func) -> setInterval func, ms

doT.templateSettings = {
  evaluate:    /\[\[([\s\S]+?)\]\]/g,
  interpolate: /\[\[=([\s\S]+?)\]\]/g,
  encode:      /\[\[!([\s\S]+?)\]\]/g,
  use:         /\[\[#([\s\S]+?)\]\]/g,
  define:      /\]\]##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
  varname:     'it',
  strip :      true,
  append:      true
};

$ ->
  _last = null
  $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")

  $(document).on "click", ".bo_container", ->
    if _last != null
      _last.removeClass("selected")
      $('.sub_container').animate({"left": "0px"}, "fast").hide()
      
    _last = $(this)
    $(this).addClass("selected")
    $('.sub_container').show().animate({"left": $(this).width() + "px"}, "fast")
        
  $(window).resize ->
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
  
  $("#btn_fetch").click ->
    fn = doT.template($("#template").text())
    $.getJSON "statuses.json", (data) -> 
      for s in data["statuses"]
        text = fn(s)
        $(".bo_list").prepend(text)
  
  $("#btn_login").click ->
    l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
    $.get "http://www.google.com", (data) ->
      console.log(data)
    # repeat 1000, -> console.log(l.url())
    # 
    # delay 1000, -> macgap.window.resize({width: 500, height: 300})
    # 
    # console.log("========" + macgap.window.url())
