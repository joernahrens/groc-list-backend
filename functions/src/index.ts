'use strict';

import {DataSnapshot} from 'firebase-functions/lib/providers/database';
import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import {Event} from "firebase-functions";
import {Change} from "firebase-functions";
import {EventContext} from "firebase-functions";
import {event} from "firebase-functions/lib/providers/analytics";

admin.initializeApp(functions.config().firebase);

exports.onNewInvite = functions.database.ref('/lists/{authId}/{listId}/invites/{inviteId}')
    .onWrite((change: Change<DataSnapshot>, context: EventContext) => {
        // ignore deletion
        if (!change.after.exists()) {
            return;
        }

        const email: string = change.after.val().email;
        const listId: string = context.params!!.listId;
        const authId: string = context.params!!.authId;

        return Promise.all(
            [admin.auth().getUser(authId),
                change.after.ref.parent!!.parent!!.child('name').once('value')])
            .then((args: Array<any>) => {
                admin.database().ref('/shared/' + email.replace(/\./g, ','))
                    .push({list: listId, owner: authId, ownerMail: args[0].email, name: args[1].val()});
            })
            .then(() => {
                change.after.ref.parent!!.parent!!.child('fellows').once('value')
                    .then((data: DataSnapshot) => {
                        if (data.exists()) {
                            data.ref.set(data.val() + ',' + email);
                        } else {
                            data.ref.set(email);
                        }
                    })
            })
            .then(() => change.after.ref.remove())
            .catch((error: any) => {
                console.error('something went wrong:');
                console.error(error);
            });
    });
