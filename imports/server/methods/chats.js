import { Meteor } from 'meteor/meteor';
import { check }  from 'meteor/check';
import _app       from '/imports/server/_app.js';

Meteor.methods({
  'chat.ensure'(_id, secret) {
    check(_id, String);
    check(secret, String);
    // return { _id };

    const connectionId = this.connection.id;
    console.log('connnected', connectionId);
    const chat = _app.Collections.Chats.findOne({ _id, secret });
    if (!chat) {
      _app.Collections.Chats.insert({
        _id,
        secret,
        connectionId,
        active: true
      });
    } else {
      _app.Collections.Chats.update({
        _id,
        secret
      }, {
        $set: {
          connectionId,
          active: true
        }
      });
    }

    this.connection.onClose(() => {
      console.log("[onClose]", connectionId);
      _app.Collections.Chats.update({
        _id,
        secret
      }, {
        $set: {
          active: false
        }
      });
    });

    return { _id };
  }
});
