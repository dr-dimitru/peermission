import _app       from '/imports/client/_app.js';
import { Meteor } from 'meteor/meteor';

_app.Collections.Messages = new Meteor.Collection('Messages');
