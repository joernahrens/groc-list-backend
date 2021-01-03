import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import DocumentData = admin.firestore.DocumentData;

admin.initializeApp(functions.config().firebase);

exports.onNewInviteFirestore = functions.firestore.document('users/{email}/lists/{list}/shares/{share}')
    .onCreate((change, context) => {
        const mailAddress = change.id;
        console.log("Mail address: " + mailAddress);
        let listKey = "";

        return Promise.all([change.ref.parent.parent.get(),
            change.ref.parent.parent.parent.parent.get()]
        )
            .then((args: Array<admin.firestore.DocumentSnapshot<DocumentData>>) => {
                listKey = args[0].id
                return admin.firestore().doc(`users/${mailAddress}/sharedLists/${args[1].id}🤓${args[0].id}`)
                    .set({
                        listOwner: args[1].id,
                        listName: args[0].id
                    })
            })
            .then(() => {
                console.log('All fine 👍, trying to send a push notification');
                return admin.firestore().collection(`users/${mailAddress}/pushToken`).get()
            })
            .then((tokens) => {
                const payload = {
                    notification: {
                        title: 'New invite!',
                        body: `You have been invited to the list ${listKey}!`
                    }
                };
                if (!tokens.empty) {
                    const pushTokens = [];
                    tokens.docs.forEach((value => {
                        pushTokens.push(value.id)
                    }))
                    return admin.messaging().sendToDevice(pushTokens, payload) as Promise<any>
                } else {
                    return Promise.resolve()
                }
            })
            .catch((error: any) => {
                console.error('something went wrong:');
                console.error(error);
            });
    });

exports.onSharedListLeft = functions.firestore.document('users/{userMail}/sharedLists/{shareConcat}')
    .onDelete((snapshot, context) => {
        return Promise.all([ snapshot.ref.parent.parent.get()]
        )
            .then((args: Array<admin.firestore.DocumentSnapshot<DocumentData>>) => {
                const userEmail = args[0].id
                const share: String = snapshot.id
                const listOwner = share.substring(0, share.indexOf("🤓"))
                const listKey = share.substring(share.indexOf("🤓") + 2, share.length)

                console.log(`List owner: ${listOwner}`)
                console.log(`List key: ${listKey}`)
                console.log(`User email: ${userEmail}`)

                return admin.firestore().doc(`users/${listOwner}/lists/${listKey}/shares/${userEmail}`)
                    .delete()
            })
            .then(() => {
                console.log('All fine 👍');
            })
            .catch((error: any) => {
                console.error('something went wrong:');
                console.error(error);
            });
    })

exports.onListMemberDeleted = functions.firestore.document('users/{ownerMail}/lists/{list}/shares/{share}')
    .onDelete((snapshot, context) => {
        return Promise.all([snapshot.ref.parent.parent.parent.parent.get(), snapshot.ref.parent.parent.get(), snapshot.ref.get()]
        )
            .then((args: Array<admin.firestore.DocumentSnapshot<DocumentData>>) => {
                const owner = args[0].id
                const list = args[1].id
                const user: String = args[2].id

                return admin.firestore().doc(`users/${user}/sharedLists/${owner}🤓${list}`)
                    .delete()
            })
            .then(() => {
                console.log('All fine 👍');
            })
            .catch((error: any) => {
                console.error('something went wrong:');
                console.error(error);
            });
    })
