import _app from '/imports/client/_app.js';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

FlowRouter.route('/', {
  name: 'index',
  action() {
    this.render('index');
  }
});

FlowRouter.route('/chats', {
  name: 'chats',
  action(params, qs, chats) {
    this.render('chats', { chats });
  },
  data() {
    return _app.Collections.Chats.find();
  },
  waitOn() {
    return Meteor.subscribe('chat.list');
  },
  whileWaiting() {
    this.render('loading');
  }
});

FlowRouter.route('/chat/:_id/:isOperator?', {
  name: 'chat',
  action(params, qs, data) {
    this.render('chat', data);
  },
  data(params) {
    return { roomId: params._id, isOperator: params.isOperator ? true : false, chats: _app.Collections.Chats.find({ _id: params._id }), messages: _app.Collections.Messages.find({ roomId: params._id }, { sort: { createdAt: -1 }}) };
  },
  waitOn(params, qs, ready) {
    const roomId = _app.ClientStorage.get('room-id');
    const secret = _app.ClientStorage.get('room-secret');

    if (params.isOperator) {
      return [Meteor.subscribe('chat.get', roomId, 'operator'), Meteor.subscribe('messages', roomId)];
    }

    if (!roomId || !secret || roomId !== params._id) {
      Meteor.setTimeout(() => {
        FlowRouter.go('start');
      }, 256);
      return [];
    }

    Meteor.call('chat.ensure', roomId, secret, (error, res) => {
      if (error) {
        console.error(error);
      } else if (res._id === roomId) {
        ready(() => {
          return [Meteor.subscribe('chat.get', roomId, secret), Meteor.subscribe('messages', roomId)];
        });
      }
    });
  },
  whileWaiting() {
    this.render('loading');
  }
});

FlowRouter.route('/start', {
  name: 'start',
  action() {
    let roomId = _app.ClientStorage.get('room-id');
    let secret = _app.ClientStorage.get('room-secret');
    if (!roomId) {
      roomId = Random.id();
      secret = Random.secret();
      _app.ClientStorage.set('room-id', roomId);
      _app.ClientStorage.set('room-secret', secret);
    }

    this.render('loading');
    Meteor.setTimeout( () => {
      FlowRouter.go('chat', { _id: roomId });
    }, 256);
  },
  whileWaiting() {
    this.render('loading');
  }
});
