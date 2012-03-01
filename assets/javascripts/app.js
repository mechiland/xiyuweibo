      function access() {
          var url = "https://api.weibo.com/oauth2/authorize?client_id=1133930912&response_type=token&redirect_uri=http://xiyuweibo.com/callback/sina"
          $.post(url, function(data){
                 console.log(data)
        })
      }
      
      
      
      $(function(){
        $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
        $(window).resize(function(){
           console.log(window.innerHeight)
            $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
        })
        
        console.log("Its ready");
        $("#btn").click(function() {
//            macgap.window.open({url: "./auth_sina.html", width: 640, height: 480})
//            l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
//                        setInterval(function(){
//                                    console.log(l.url())
//                                    }, 1000)
                        macgap.window.open({url:"http://scottjehl.github.com/Respond/test/test.html", width: 500, height: 400})
            
            
        })
        
        setTimeout(function(){
//                   window.width = 1000;
                   macgap.window.resize({width: 500, height: 300})           
        }, 5000)
        
        console.log("========" + macgap.window.url())
    })
