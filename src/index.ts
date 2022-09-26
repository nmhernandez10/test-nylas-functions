import * as functions from 'firebase-functions';
import app from './app';
import firebase from 'firebase-admin';

firebase.initializeApp();
firebase.firestore().settings({ ignoreUndefinedProperties: true });

export const api = functions.https.onRequest(app);
