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
    added(_id, doc) {
      if (nowDate < doc.timestamp) {
        console.log("added", doc);
      }
    },
    changed(_id, doc) {
      console.log("changed", doc, myScreenPeer, userPeer);
      // if (doc.type === 'screen-call') {
        if (userPeer && doc.message) {
          try {
            JSON.parse(doc.message).forEach((offer) => {
              console.log(offer);
              userPeer.signal(offer);
            });
          } catch (e) {
            console.error(e);
          }
        } else if (myScreenPeer && doc.offerAnswer) {
          console.log("offerAnswer", doc.offerAnswer);
          try {
            JSON.parse(doc.offerAnswer).forEach((offer) => {
              console.log(offer);
              myScreenPeer.signal(offer);
            });
          } catch (e) {
            console.error(e);
          }
        }
      // }
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
    console.log(this);
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

    const signalingData = [];
    userPeer.on('signal', (data) => {
      console.log('userPeer signal', data);
      signalingData.push(data);
      Meteor.call('messages.updateSignaling.operator', this._id, JSON.stringify(signalingData));
    });

    userPeer.on('connect', (data) => {
      console.log('userPeer connect', data);
    });

    userPeer.on('stream', (stream) => {
      console.log('>>>>>>>> userPeer stream', stream);
      var video = document.getElementById('screenSharingVideo');
      video.onloadedmetadata = function() {
        video.play();
      };
      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        video.src = window.URL.createObjectURL(stream);
      }
      video.play();
    });

    userPeer.on('track', (data) => {
      // const stream =  new MediaStream(data);
      console.log('userPeer track', data);
      // const video = document.getElementById('screenSharingVideo');
      // video.onloadedmetadata = function() {
      //   video.play();
      // };
      // // Older browsers may not have srcObject
      // if ('srcObject' in video) {
      //   video.srcObject = stream;
      // } else {
      //   // Avoid using this in new browsers, as it is going away.
      //   video.src = window.URL.createObjectURL(stream);
      // }
    });

    userPeer.on('close', (data) => {
      console.log('userPeer close', data);
    });

    userPeer.on('error', (data) => {
      console.log(' userPeererror', data);
    });

    if (this.message) {
      try {
        const signalingData = JSON.parse(this.message);
        signalingData.forEach((offer) => {
          userPeer.signal(offer);
        });
      } catch (error) {
        console.error(error);
      }
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

          let signalingData = [];

          myScreenPeer.on('signal', (data) => {
            console.log('signal', data);
            signalingData.push(data);
            // signalingData = [data];
            Meteor.call('messages.updateSignaling', messageId, JSON.stringify(signalingData));
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

      // const video = document.getElementById('demo-video');
      // // Older browsers may not have srcObject
      // if ('srcObject' in video) {
      //   video.srcObject = stream;
      // } else {
      //   // Avoid using this in new browsers, as it is going away.
      //   video.src = window.URL.createObjectURL(stream);
      // }
      // video.onloadedmetadata = function(e) {
      //   video.play();
      // };
    };

    const OnStreamDenied = (...args) => {
      console.log("OnStreamDenied", args)
      isScreenSharingError.set('Can not start screen sharing session');
    };

    getUserMedia().then(onStreamApproved).catch(OnStreamDenied);
    // getUserMedia(session, onStreamApproved, OnStreamDenied); 
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


