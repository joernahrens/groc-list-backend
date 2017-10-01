'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require('firebase-functions');
var fbAdmin = require('firebase-admin');
fbAdmin.initializeApp(functions.config().firebase);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
exports.onNewInvite = functions.database.ref('/lists/{authId}/{listId}/invites/{inviteId}')
    .onWrite(function (snapshot) {
    var email = snapshot.val().email;
    console.log('new invite: ' + email);
});
