import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

FlowRouter.route('/', {
  name: 'index',
  action() {
    this.render('index');
  }
});
