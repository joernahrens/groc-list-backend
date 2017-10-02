'use strict';

import DataSnapshot = admin.database.DataSnapshot;
import {DeltaSnapshot} from 'firebase-functions/lib/providers/database';
import {Event} from 'firebase-functions';

const functions = require('firebase-functions');
const fbAdmin = require('firebase-admin');
fbAdmin.initializeApp(functions.config().firebase);

exports.onNewInvite = functions.database.ref('/lists/{authId}/{listId}/invites/{inviteId}')
    .onWrite((event: Event<DeltaSnapshot>) => {
        const email: string = event.data.val().email;
        const listId: string = event.params!!.listId;
        const authId: string = event.params!!.authId;

        return Promise.all(
            [fbAdmin.auth().getUser(authId),
                event.data.ref.parent!!.parent!!.child('name').once('value')])
            .then((args: Array<any>) => {
                fbAdmin.database().ref('/shared/' + email.replace('.', ','))
                    .push({list: listId, owner: authId, ownerMail: args[0].email, name: args[1].val()});
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
