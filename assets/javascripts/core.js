var api_prefix;

api_prefix = "https://api.weibo.com";

$(function() {
  var AccessToken, Comment, CommentList, ListView, NewStatusView, Routes, Tweet, TweetDetailView, TweetList, TweetView, TweetsView, User, UserDetailView, UserList, Users, Workspace, _last;
  AccessToken = Backbone.Model.extend({
    defaults: function() {
      return {
        created_at: new Date
      };
    }
  });
  window.AccessTokenList = Backbone.Collection.extend({
    model: AccessToken
  });
  window.Tokens = new AccessTokenList;
  User = Backbone.Model.extend({});
  UserList = Backbone.Collection.extend({
    model: User
  });
  Users = new UserList;
  Tweet = Backbone.Model.extend({});
  TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    api: "" + api_prefix + "/2/statuses/home_timeline.json",
    initialize: function() {
      this.bind("add", this.updateUser, this);
      return Tokens.bind("add", this.updateToken, this);
    },
    updateToken: function(t) {
      return this.token = t.get("token");
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
      return $.getJSON(this.api, {
        access_token: this.token
      }, function(data) {
        _this.add(data["statuses"].reverse());
        _this.min_id = _this.at(0).id;
        return _this.max_id = _this.at(_this.length - 1).id;
      });
    },
    update_latest: function() {
      var _this = this;
      console.log("Updating from server...> " + this.max_id + " using token: " + this.token);
      return $.getJSON(this.api, {
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
  Comment = Backbone.Model.extend({});
  CommentList = Backbone.Collection.extend({
    model: Comment,
    api: "" + api_prefix + "/2/comments/show.json",
    fetch_local: function() {
      var _this = this;
      return $.getJSON("status_comments.json", function(data) {
        return _this.add(data["comments"].reverse());
      });
    }
  });
  window.Comments = new CommentList;
  _last = null;
  TweetView = Backbone.View.extend({
    tagName: 'li',
    className: 'bo_container',
    events: {
      "click .avatar": "show_user",
      "click .user_link": "show_user_link",
      "click .reply": "reply",
      "click .retweet": "retweet",
      "click": "show_detail"
    },
    template: doT.template($("#template").text()),
    initialize: function() {
      return Tokens.bind("add", this.updateToken, this);
    },
    updateToken: function(t) {
      return this.token = t.get("token");
    },
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
    reply: function() {
      return false;
    },
    retweet: function() {
      return false;
    },
    show_user: function() {
      Routes.navigate("users/" + (this.model.get("user").id), {
        trigger: true
      });
      return false;
    }
  });
  TweetDetailView = Backbone.View.extend({
    el: $("#inner"),
    side_width: "500px",
    template: doT.template($("#template_full").text()),
    comment_template: doT.template($("#comments_template").text()),
    render: function() {
      var _this;
      _this = this;
      $(this.el).scrollTop(0);
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each(function() {
        $(this).css("width", _this.side_width);
        if ($(this).css("left") !== "0px") {
          $(this).html(_this.template(_this.model.toJSON()));
          return $(this).find(".recent_comments").html(_this.comment_template(Comments.toJSON()));
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
  NewStatusView = Backbone.View.extend({
    el: $("#new_status"),
    events: {
      "click .cancel": "cancel",
      "click .submit": "submit"
    },
    initialize: function() {
      return Tokens.bind("add", this.updateToken, this);
    },
    updateToken: function(t) {
      return this.token = t.get("token");
    },
    render: function() {
      $(this.el).animate({
        "bottom": "200px"
      }, "fast");
      $(this.el).find("textarea").focus();
      return $("#overlay").css("z-index", "150");
    },
    cancel: function() {
      $(this.el).animate({
        "bottom": "-130px"
      }, "fast");
      return $("#overlay").css("z-index", "-1");
    },
    submit: function() {
      var api;
      api = "https://api.weibo.com/2/statuses/update.json";
      $.post(api, {
        access_token: this.token,
        status: $("#new_status_content").val()
      }, function() {
        return $("#new_status_content").val("");
      });
      $(this.el).animate({
        "bottom": "1000px"
      }, "fast", function() {});
      $(this).css("bottom", "-130px");
      return $("#overlay").css("z-index", "-1");
    }
  });
  window.NewStatus = new NewStatusView;
  Workspace = Backbone.Router.extend({
    routes: {
      "tweets/:id": "show_tweet",
      "users/:id": "show_user"
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
