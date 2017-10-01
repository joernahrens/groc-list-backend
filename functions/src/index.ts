'use strict';

import {DeltaSnapshot} from 'firebase-functions/lib/providers/database';
import {Event} from 'firebase-functions';
import UserRecord = admin.auth.UserRecord;

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
    .onWrite((event: Event<DeltaSnapshot>) => {
        const email: string = event.data.val().email;
        const listId: string = event.params!!.listId;
        const authId: string = event.params!!.authId;

        return fbAdmin.auth().getUser(authId)
            .then((owner: UserRecord) => {
                fbAdmin.database().ref('/shared/' + email.replace('.', ','))
                    .push({list: listId, owner: authId, ownerMail: owner.email});
            })
            .then(() => event.data.adminRef.remove())
            .catch((error: any) => {
                console.error('something went wrong');
            });
    });
