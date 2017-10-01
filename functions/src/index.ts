'use strict';

import {DeltaSnapshot} from 'firebase-functions/lib/providers/database';
import {Event} from 'firebase-functions';
import UserRecord = admin.auth.UserRecord;
import DataSnapshot = admin.database.DataSnapshot;

const functions = require('firebase-functions');
const fbAdmin = require('firebase-admin');
fbAdmin.initializeApp(functions.config().firebase);

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
            .then(() => {
                event.data.adminRef.parent!!.parent!!.child('fellows').once('value')
                    .then((data: DataSnapshot) => {
                        if (data.exists()) {
                            data.ref.set(data.val() + ',' + email);
                        } else {
                            data.ref.set(email);
                        }
                    })
            })
            .then(() => event.data.adminRef.remove())
            .catch((error: any) => {
                console.error('something went wrong');
            });
    });
