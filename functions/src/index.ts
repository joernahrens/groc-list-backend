import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import DocumentData = admin.firestore.DocumentData;

admin.initializeApp(functions.config().firebase);

exports.onNewInvite = functions.database.ref('/lists/{authId}/{listId}/invites/{inviteId}')
    .onWrite((change: functions.Change<functions.database.DataSnapshot>, context: functions.EventContext) => {
        // ignore deletion
        if (change.after.exists()) {
            const email: string = change.after.val().email;
            const listId: string = context.params.listId;
            const authId: string = context.params.authId;

            return Promise.all(
                [admin.auth().getUser(authId),
                    change.after.ref.parent!!.parent!!.child('name').once('value')])
                .then((args: Array<any>) => {
                    admin.database().ref('/shared/' + email.replace(/\./g, ','))
                        .push({list: listId, owner: authId, ownerMail: args[0].email, name: args[1].val()});
                })
                .then(() => {
                    change.after.ref.parent!!.parent!!.child('fellows').once('value')
                        .then((data: admin.database.DataSnapshot) => {
                            if (data.exists()) {
                                return data.ref.set(data.val() + ',' + email);
                            } else {
                                return data.ref.set(email);
                            }
                        })
                        .catch((error: any) => {
                            console.error('something went wrong:');
                            console.error(error);
                        });
                })
                .then(() => change.after.ref.remove())
                .catch((error: any) => {
                    console.error('something went wrong:');
                    console.error(error);
                });
        } else {
            return Promise.resolve();
        }
    });

exports.onNewInviteFirestore = functions.firestore.document('users/{email}/lists/{list}/shares/{share}')
    .onCreate((change, context) => {
        // if (!change.after.exists) {
        //     return;
        // }

        const mailAddress = change.id;
        console.log("Mail address: " + mailAddress);

        return Promise.all([change.ref.parent.parent.get(),
            change.ref.parent.parent.parent.parent.get()]
        )
            .then((args: Array<admin.firestore.DocumentSnapshot<DocumentData>>) => {
                return admin.firestore().doc(`users/${mailAddress}/sharedLists/${args[1].id}-${args[0].id}`)
                    .set({
                        listOwner: args[1].id,
                        listName: args[0].id
                    })
            })
            .then(() => {
                console.log('All fine 👍');
            })
            .catch((error: any) => {
                console.error('something went wrong:');
                console.error(error);
            });
    });
