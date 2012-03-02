var Status, StatusView, Statuses;

Status = Backbone.Model.extend({});

Statuses = Backbone.Collection.extend({
  model: Status
});

StatusView = Backbone.View.extend({
  el: "#sub_container"
});
