delay = (ms, func) -> setTimeout func, ms
repeat = (ms, func) -> setInterval func, ms

$ ->
  ($ ".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
  $(window).resize ->
    console.log(window.innerHeight)
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
    console.log("Its ready");
    $("#btn").click ->
      macgap.window.open({url: "./auth_sina.html", width: 640, height: 480})
      l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
      repeat 1000, -> console.log(l.url())
      macgap.window.open({url:"http://scottjehl.github.com/Respond/test/test.html", width: 500, height: 400})

      delay 1000, -> macgap.window.resize({width: 500, height: 300})

      console.log("========" + macgap.window.url())
