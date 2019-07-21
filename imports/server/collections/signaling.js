import _app       from '/imports/server/_app.js';
import { check, Match }  from 'meteor/check';
import { Mongo }  from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

_app.Collections.Signaling = new Mongo.Collection('Signaling');

_app.Collections.Signaling.deny({
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

_app.Collections.Signaling._ensureIndex({ roomId: 1, userType: 1 });

Meteor.publish('signaling', function(roomId, userType) {
  check(roomId, String);
  check(userType, Match.OneOf('user', 'operator'));

  return _app.Collections.Signaling.find({ roomId, userType });
});

Meteor.methods({
  'signaling.clear'(_id) {
    check(_id, String);
    return _app.Collections.Signaling.remove({ _id });
  },
  'signaling.add'(obj) {
    check(obj, Object);
    return _app.Collections.Signaling.insert(obj);
  }
});
