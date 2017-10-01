'use strict';

import {DeltaSnapshot} from 'firebase-functions/lib/providers/database';

const functions = require('firebase-functions');
const fbAdmin = require('firebase-admin');
fbAdmin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.onNewInvite = functions.database.ref('/lists/{authId}/{listId}/invites/{inviteId}')
    .onWrite((snapshot: DeltaSnapshot) => {
        const email: string = snapshot.val().email;
        console.log('new invite: ' + email);
    });
