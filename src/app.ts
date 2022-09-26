import express from 'express';
import Nylas from 'nylas';
import { firestore } from 'firebase-admin';
import cors from 'cors';
import { Config } from './config';
import { NylasService } from './nylas_service';
import { log } from 'firebase-functions/logger';

const app = express();

app.use(cors({ origin: true }));

// Nylas initialization
Nylas.config({
  clientId: Config.clientId,
  clientSecret: Config.clientSecret,
});

app.get('/', (_, res) => {
  res.sendStatus(200);
});

app.get('/auth-callback', async (req, res) => {
  const flutterUrl = Config.flutterUrl;

  // Saving information about requests
  await firestore().collection('auth-callbacks').doc().create({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    createdAt: firestore.Timestamp.now(),
  });

  const authCode: string = (req.query['code'] as string) ?? '';
  const state: string = (req.query['state'] as string) ?? '';

  const createTokenResponse = await NylasService.createAccessToken(authCode);

  await firestore().collection('users').doc(createTokenResponse.data.account_id).set({
    authData: createTokenResponse.data,
    state: state,
    createdAt: firestore.Timestamp.now(),
  });

  res.redirect(flutterUrl);
});

app.post('/webhooks-callback', async (req, res) => {
  // Saving information about requests
  await firestore().collection('webhooks-callbacks').doc().create({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    createdAt: firestore.Timestamp.now(),
  });

  try {
    NylasService.getEvent(req.body['deltas'][0]['object_data']).catch((error) => {
      log('Error getting event:', error);
      log(`${error}`);
    });
  } catch (e) {
    log('Error getting event');
  }

  const challenge: string = (req.query['challenge'] as string) ?? '';

  res.status(200).send(challenge);
});

export default app;
