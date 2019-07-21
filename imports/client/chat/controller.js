import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import DetectRTC from 'detectrtc';
import './view.jade';

const isLoading = new ReactiveVar(true);
const isSending = new ReactiveVar(false);


Template.chat.onCreated(function() {
  // const localConnection = new RTCPeerConnection();
  // const dataChannel = localConnection.createDataChannel('chat');
  // const dataChannelStatusChange = (e) => {
  //   if (dataChannel && dataChannel.readyState) {
  //     if (dataChannel.readyState === 'open') {
  //       isLoading.set(false);
  //     } else {
  //       isLoading.set(true);
  //     }
  //   }
  // }

  // dataChannel.onopen = dataChannelStatusChange


  // stopObserver = this.data.chat.observeChanges({
  //   changed(_id, fields) {
  //     console.log("changed", _id, fields);
  //   }
  // });
  // console.log("stopObserver", stopObserver);
});

Template.chat.onRendered(function () {
  isLoading.set(false);
});

Template.chat.onDestroyed(function() {
  // if (stopObserver) {
  //   stopObserver.stop();
  //   stopObserver = false;
  // }
});

Template.chat.helpers({
  isLoading() {
    return isLoading.get();
  },
  isSending() {
    return isSending.get();
  },
  messages() {
    const template = Template.instance();
    if (!template) {
      return [];
    }
    return template.data.messages;
  }
});

Template.chat.events({
  'submit [data-send-message]'(e, template) {
    e.preventDefault();
    const message = e.currentTarget.message.value.trim();

    if (!message) {
      return false;
    }

    isSending.set(true);

    Meteor.call('messages.send', {
      roomId: template.data.roomId,
      from: template.data.isOperator ? 'operator' : 'user',
      to: template.data.isOperator ? 'user' : 'operator',
      type: 'text',
      message,
      isRead: false,
      timestamp: Date.now()
    }, (error) => {
      e.currentTarget.message.value = '';
      isSending.set(false);
      if (error) {
        console.error(error);
      }
    });

    return false;
  }
});


