delay = (ms, func) -> setTimeout func, ms
repeat = (ms, func) -> setInterval func, ms

$ ->
  _last = null
  $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
  $(".bo_container").click ->
    if _last != null
      _last.removeClass("selected")
      $('.sub_container').animate({"left": "0px"}, "fast").hide()
      
    _last = $(this)
    $(this).addClass("selected")
    $('.sub_container').show().animate({"left": $(this).width() + "px"}, "fast")
  $(window).resize ->
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")

  $("#btn").click ->
    macgap.window.open({url: "./auth_sina.html", width: 640, height: 480})
    l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
    repeat 1000, -> console.log(l.url())
    macgap.window.open({url:"http://scottjehl.github.com/Respond/test/test.html", width: 500, height: 400})

    delay 1000, -> macgap.window.resize({width: 500, height: 300})

    console.log("========" + macgap.window.url())
