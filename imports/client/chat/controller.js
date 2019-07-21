import { Meteor }      from 'meteor/meteor';
import { Template }    from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import DetectRTC       from 'detectrtc';
import Peer            from 'simple-peer';
import './view.jade';

const isLoading = new ReactiveVar(true);
const isSending = new ReactiveVar(false);
let stopObserver = false;
const nowDate = Date.now();


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


  stopObserver = this.data.messages.observeChanges({
    added(_id, fields) {
      if (nowDate < fields.timestamp) {
        console.log("added", _id, fields);
      }
    }
  });
});

Template.chat.onRendered(function () {
  isLoading.set(false);
});

Template.chat.onDestroyed(function() {
  if (stopObserver) {
    stopObserver.stop();
    stopObserver = false;
  }
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
  'click [data-start-screen-sharing]'(e, template) {
    e.preventDefault();

    const getUserMedia = (function () {
      if(navigator.getUserMedia) {
          return navigator.getUserMedia.bind(navigator)
      }
      if(navigator.webkitGetUserMedia) {
        return navigator.webkitGetUserMedia.bind(navigator)
      }
      if(navigator.mozGetUserMedia) {
        return navigator.mozGetUserMedia.bind(navigator)
      }
    })();
    const session = {
      audio: false,
      video: {
        // mandatory: {
          // chromeMediaSource: 'screen',
          maxWidth: 1024,
          maxHeight: 576,
          minAspectRatio: 1.77
        // },
        // optional: []
      }
    };

    const onStreamApproved = (...args) => {
      console.log("onStreamApproved", args)
    };

    const OnStreamDenied = (...args) => {
      console.log("OnStreamDenied", args)
    };

    getUserMedia(session, onStreamApproved, OnStreamDenied); 
    // console.log(navigator.mediaDevices.getUserMedia(session).then(onStreamApproved).catch(OnStreamDenied));
    return false;
  },
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


