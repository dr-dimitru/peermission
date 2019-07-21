import { Meteor }      from 'meteor/meteor';
import { Template }    from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import DetectRTC       from 'detectrtc';
import Peer            from 'simple-peer';
import './view.jade';

const isLoading = new ReactiveVar(true);
const isSending = new ReactiveVar(false);
const isSharingScreen = new ReactiveVar(false);
const isScreenSharingError = new ReactiveVar(false);

let userPeer = false;
let myScreenPeer = false;
let stopObserver = false;
let nowDate = Date.now();
let pending = [];


Template.chat.onCreated(function() {
  const userType = this.data.isOperator ? 'operator' : 'user';

  stopObserver = this.data.signaling.observeChanges({
    added(_id, doc) {
      console.log('signaling added', _id, doc);
      if (doc.userType === userType) {
        if (userType === 'user' && myScreenPeer) {
          myScreenPeer.signal(doc.data);
          console.log('signaling applied', _id, doc);
        } else if (userType === 'operator') {
          if (userPeer) {
            userPeer.signal(doc.data);
            console.log('signaling applied', _id, doc);
          } else {
            pending.push(doc.data);
          }
        }

        Meteor.call('signaling.clear', _id, (error, res) => {
          console.log('signaling.clear', _id, {error, res});
        });
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
  nowDate() {
    return nowDate;
  },
  isLoading() {
    return isLoading.get();
  },
  isSending() {
    return isSending.get();
  },
  isScreenSharingError() {
    return isScreenSharingError.get();
  },
  isSharingScreen() {
    return isSharingScreen.get();
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
  'click [data-accept-screen-sharing]'(e, template) {
    e.preventDefault();
    userPeer = new Peer({
      initiator: false,
      config: {
        iceServers: [{
          urls: 'stun:stun.services.mozilla.com',
          url: 'stun:stun.services.mozilla.com'
        // }, {
        //   urls: 'stun:stun.l.google.com:19302',
        //   url: 'stun:stun.l.google.com:19302'
        // }, {
      //     'urls': 'turn:192.158.29.39:3478?transport=udp',
      //     'url': 'turn:192.158.29.39:3478?transport=udp',
      //     'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      //     'username': '28224511:1379330808'
      //   }, {
      //     'urls': 'turn:192.158.29.39:3478?transport=tcp',
      //     'url': 'turn:192.158.29.39:3478?transport=tcp',
      //     'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      //     'username': '28224511:1379330808'
        }],
        // optional: [{DtlsSrtpKeyAgreement: true}]
      }
    });

    userPeer.on('signal', (data) => {
      console.log('userPeer signal', data);
      Meteor.call('signaling.add', {
        roomId: template.data.roomId,
        userType: 'user',
        data: data
      }, console.log.bind(console));
    });

    userPeer.on('connect', (data) => {
      console.log('userPeer connect', data);
    });

    userPeer.on('stream', (stream) => {
      console.log('>>>>>>>> userPeer stream', stream);
      var video = document.getElementById('screenSharingVideo');
      video.onloadedmetadata = function() {
        console.log(">>>>>>>>>>>>>>>> onloadedmetadata")
        video.play();
      };
      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        video.src = window.URL.createObjectURL(stream);
      }
      // video.play();
    });

    userPeer.on('close', (data) => {
      console.log('userPeer close', data);
    });

    userPeer.on('error', (data) => {
      console.log(' userPeererror', data);
    });

    if (pending && pending.length) {
      pending.forEach((offer) => {
        userPeer.signal(offer);
      });

      pending = [];
    }
    return false;
  },
  'click [data-start-screen-sharing]'(e, template) {
    e.preventDefault();

    const session = {
      audio: false,
      video: {
        mediaSource: 'screen',
        chromeMediaSource: 'screen',
        maxWidth: 1024,
        maxHeight: 576,
        minAspectRatio: 1.77
      }
    };

    const getUserMedia = function () {
      if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia(session);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia(session);
      }

      return navigator.mediaDevices.getUserMedia(session);
    };

    const onStreamApproved = (stream) => {
      console.log("onStreamApproved", stream)
      isSharingScreen.set(true);
      stream.getVideoTracks()[0].onended = function () {
        isSharingScreen.set(false);
      };

      Meteor.call('messages.send', {
        roomId: template.data.roomId,
        from: 'user',
        to: 'operator',
        type: 'screen-call',
        message: '',
        isRead: false,
        timestamp: Date.now()
      }, (error, messageId) => {
        isSending.set(false);
        if (error) {
          console.error(error);
        } else {
          myScreenPeer = new Peer({
            initiator: true,
            stream: stream,
            config: {
              iceServers: [{
                urls: 'stun:stun.services.mozilla.com',
                url: 'stun:stun.services.mozilla.com'
              // }, {
              //   urls: 'stun:stun.l.google.com:19302',
              //   url: 'stun:stun.l.google.com:19302'
            //     'urls': 'turn:192.158.29.39:3478?transport=udp',
            //     'url': 'turn:192.158.29.39:3478?transport=udp',
            //     'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            //     'username': '28224511:1379330808'
            //   }, {
            //     'urls': 'turn:192.158.29.39:3478?transport=tcp',
            //     'url': 'turn:192.158.29.39:3478?transport=tcp',
            //     'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            //     'username': '28224511:1379330808'
              }],
            //   optional: [{DtlsSrtpKeyAgreement: true}]
            }
          });

          myScreenPeer.on('signal', (data) => {
            console.log('signal', data);

            Meteor.call('signaling.add', {
              roomId: template.data.roomId,
              userType: 'operator',
              data: data
            }, console.log.bind(console));
          });

          myScreenPeer.on('connect', (data) => {
            console.log('myScreenPeer connect', data);
          });

          myScreenPeer.on('close', (data) => {
            console.log('close', data);
            isSharingScreen.set(false);
          });

          myScreenPeer.on('error', (data) => {
            console.log('error', data);
            isSharingScreen.set(false);
          });
        }
      });
    };

    const OnStreamDenied = (...args) => {
      console.log("OnStreamDenied", args)
      isScreenSharingError.set('Can not start screen sharing session');
    };

    getUserMedia().then(onStreamApproved).catch(OnStreamDenied);
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


