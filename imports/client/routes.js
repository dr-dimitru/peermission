import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

FlowRouter.route('/', {
  name: 'index',
  action() {
    this.render('index');
  }
});

FlowRouter.route('/chats', {
  name: 'chats',
  action() {
    this.render('chats');
  }
});

FlowRouter.route('/chat/:_id', {
  name: 'chat',
  action() {
    this.render('chat');
  }
});
