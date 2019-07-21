import { Meteor } from 'meteor/meteor';
import { check, Match }  from 'meteor/check';
import _app       from '/imports/server/_app.js';

Meteor.methods({
  'messages.send'(messageObj) {
    check(messageObj, {
      roomId: String,
      from: Match.OneOf('operator', 'user'),
      to: Match.OneOf('operator', 'user'),
      type: Match.OneOf('text', 'screen-call', 'screen-offer', 'screen-answer'),
      message: String,
      isRead: Boolean,
      timestamp: Number
    });

    return _app.Collections.Messages.insert(messageObj);
  },
  'messages.updateSignaling'(_id, singnalingData) {
    check(_id, String);
    check(singnalingData, String);

    _app.Collections.Messages.update(_id, {
      $set: {
        message: singnalingData
      }
    });

    return true;
  }
});
