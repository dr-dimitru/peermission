import _app       from '/imports/server/_app.js';
import { check }  from 'meteor/check';
import { Mongo }  from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

_app.Collections.Messages = new Mongo.Collection('Messages');

_app.Collections.Messages.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  }
});

_app.Collections.Messages._ensureIndex({ roomId: 1, createdAt: -1 });

Meteor.publish('messages', function(roomId) {
  check(roomId, String);

  return _app.Collections.Messages.find({ roomId }, { limit: 100,  sort: { createdAt: -1 }});
});
