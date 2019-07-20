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
    return _app.Chats.find();
  },
  waitOn() {
    return Meteor.subscribe('chat.list');
  },
  whileWaiting() {
    this.render('loading');
  }
});

FlowRouter.route('/chat/:_id', {
  name: 'chat',
  action(params) {
    this.render('chat', { _id: params._id });
  },
  waitOn(params, qs, ready) {
    const roomId = _app.ClientStorage.get('room-id');
    const secret = _app.ClientStorage.get('room-secret');
    if (!roomId || !secret || roomId !== params._id) {
      FlowRouter.go('start');
      return [];
    }

    Meteor.call('chat.ensure', roomId, secret, (error, res) => {
      if (error) {
        console.error(error);
      } else if (res._id === roomId) {
        ready(() => {
          return Meteor.subscribe('chat.get', roomId, secret);
        });
      }
    });

    return [];
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
