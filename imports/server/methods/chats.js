import { Meteor } from 'meteor/meteor';
import { check }  from 'meteor/check';
import _app       from '/imports/server/_app.js';

Meteor.methods({
  'chat.ensure'(_id, secret) {
    check(_id, String);
    check(secret, String);

    const connectionId = this.connection.id;
    const chat = _app.Collections.Chats.findOne({ _id, secret });
    if (!chat) {
      _app.Collections.Chats.insert({
        _id,
        secret,
        connectionId,
        active: true
      });

      _app.Collections.Messages.insert({
        roomId: _id,
        from: 'operator',
        to: 'user',
        type: 'text',
        message: 'Hello! Howdy? Send us a message if you need help :)',
        isRead: false
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
