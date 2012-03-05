var sina_api;

sina_api = {
  home: "https://api.weibo.com/2/statuses/home_timeline.json"
};

$(function() {
  var ListView, Routes, Tweet, TweetDetailView, TweetView, TweetsView, User, UserDetailView, UserList, Users, Workspace, _last;
  User = Backbone.Model.extend({});
  UserList = Backbone.Collection.extend({
    model: User
  });
  Users = new UserList;
  Tweet = Backbone.Model.extend({});
  window.TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    initialize: function() {
      return this.bind("add", this.updateUser, this);
    },
    updateUser: function(s) {
      var json, user1, user2;
      json = s.toJSON();
      user1 = json["user"];
      if (json["retweeted_status"]) user2 = json["retweeted_status"]["user"];
      this._updateUser(user1);
      if (user2) return this._updateUser(user2);
    },
    _updateUser: function(json) {
      var u;
      u = Users.get(json["id"]);
      if (u) {
        return u.set(json);
      } else {
        return Users.add(new User(json));
      }
    },
    init: function(token) {
      var _this = this;
      this.token = token;
      console.log("get token: " + this.token);
      return $.getJSON(sina_api.home, {
        access_token: this.token
      }, function(data) {
        _this.add(data["statuses"].reverse());
        _this.min_id = _this.at(0).id;
        return _this.max_id = _this.at(_this.length - 1).id;
      });
    },
    update_latest: function() {
      var _this = this;
      console.log("Updating from server...> " + this.max_id);
      return $.getJSON(sina_api.home, {
        access_token: this.token,
        since_id: this.max_id
      }, function(data) {
        _this.add(data["statuses"].reverse());
        _this.min_id = _this.at(0).id;
        return _this.max_id = _this.at(_this.length - 1).id;
      });
    },
    fetch_local: function() {
      var _this = this;
      return $.getJSON("home_timeline.json", function(data) {
        return _this.add(data["statuses"].reverse());
      });
    }
  });
  window.Tweets = new TweetList;
  window.AccessToken = Backbone.Model.extend({
    defaults: function() {
      return {
        created_at: new Date
      };
    }
  });
  _last = null;
  TweetView = Backbone.View.extend({
    tagName: 'li',
    className: 'bo_container',
    events: {
      "click .avatar": "show_user",
      "click .user_link": "show_user_link",
      "click .content": "show_detail"
    },
    template: doT.template($("#template").text()),
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
    show_detail: function() {
      if (_last !== null) {
        if (_last === this) return;
        $(_last.el).removeClass("selected");
      }
      $(this.el).addClass("selected");
      _last = this;
      return Routes.navigate("tweets/" + this.model.id, {
        trigger: true
      });
    },
    show_user_link: function(el) {
      location.href = $(el.target).attr("href");
      return false;
    },
    show_user: function() {
      return Routes.navigate("users/" + (this.model.get("user").id), {
        trigger: true
      });
    }
  });
  TweetDetailView = Backbone.View.extend({
    el: $("#inner"),
    side_width: "500px",
    template: doT.template($("#template_full").text()),
    render: function() {
      var _this;
      _this = this;
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each(function() {
        $(this).css("width", _this.side_width);
        if ($(this).css("left") !== "0px") {
          return $(this).html(_this.template(_this.model.toJSON()));
        }
      });
      return this._animate();
    },
    _animate: function() {
      var _this;
      _this = this;
      return $(this.el).animate({
        "left": "+" + this.side_width
      }, "fast", function() {
        return $(_this.el).find(".anim_block").each(function(el) {
          var new_width, old;
          old = $(this).css("left");
          if (old === "0px") {
            new_width = "-" + _this.side_width;
          } else {
            new_width = "0px";
          }
          $(this).css("left", new_width);
          return $(_this.el).css("left", "0px");
        });
      });
    }
  });
  UserDetailView = TweetDetailView.extend({
    template: doT.template($("#user_detail_template").text())
  });
  TweetsView = Backbone.View.extend({
    el: $("#tweets_list"),
    initialize: function() {
      return Tweets.bind('add', this.addOne, this);
    },
    addOne: function(s) {
      var view;
      view = new TweetView({
        model: s,
        id: "status-" + s.id,
        attributes: {
          "data-id": s.id
        }
      });
      return $("#tweets_list").prepend(view.render().el);
    },
    showTweet: function(id) {
      var view;
      view = new TweetDetailView({
        model: Tweets.get(parseInt(id))
      });
      return view.render();
    },
    showUser: function(id) {
      return new UserDetailView({
        model: Users.get(parseInt(id))
      }).render();
    }
  });
  ListView = new TweetsView;
  Workspace = Backbone.Router.extend({
    routes: {
      "": "index",
      "tweets/:id": "show_tweet",
      "users/:id": "show_user"
    },
    index: function() {
      return console.log("Home");
    },
    show_tweet: function(id) {
      if (Tweets.length > 0) return ListView.showTweet(id);
    },
    show_user: function(id) {
      if (Users.length > 0) return ListView.showUser(id);
    }
  });
  Routes = new Workspace;
  return Backbone.history.start();
});
