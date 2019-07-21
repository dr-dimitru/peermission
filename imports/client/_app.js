import { ClientStorage } from 'ClientStorage';
import { Template } from 'meteor/templating';
import moment from 'moment';

Template.registerHelper('moment', (time) => {
  return moment(time).fromNow();
});

const _app = {
  Collections: {},
  ClientStorage,
  moment
};

export default _app;
