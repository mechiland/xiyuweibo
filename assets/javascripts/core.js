var Status, StatusView, Statuses, sina_api;

sina_api = {
  home: "https://api.weibo.com/2/statuses/home_timeline.json"
};

Status = Backbone.Model.extend({});

Statuses = Backbone.Collection.extend({
  model: Status,
  min_id: 0,
  max_id: 0,
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
  }
});

StatusView = Backbone.View.extend({
  el: "#sub_container"
});
