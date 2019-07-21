import _app       from '/imports/server/_app.js';
import { check }  from 'meteor/check';
import { Mongo }  from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

_app.Collections.Chats = new Mongo.Collection('Chats');

_app.Collections.Chats.deny({
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

_app.Collections.Chats._ensureIndex({ _id: 1, secret: 1, sessionId: 1 });
_app.Collections.Chats._ensureIndex({ _id: 1, secret: 1 });
_app.Collections.Chats._ensureIndex({ active: 1 });

Meteor.publish('chat.get', function(_id, secret) {
  check(_id, String);
  check(secret, String);

  if (secret === 'operator') {
    return _app.Collections.Chats.find({ _id });
  }
  return _app.Collections.Chats.find({ _id, secret, sessionId: this.sessionId });
});

Meteor.publish('chat.operator', function(_id) {
  check(_id, String);

  return _app.Collections.Chats.find({ _id });
});

Meteor.publish('chat.list', function() {
  return _app.Collections.Chats.find({ active: true });
});
