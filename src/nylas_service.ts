import axios from 'axios';
import { firestore } from 'firebase-admin';
import Nylas from 'nylas';
import Event from 'nylas/lib/models/event';
import { Config } from './config';
import { CreateAcessTokenRes } from './models/create_access_token_res';
import { DeltaObjectData } from './models/delta_object_data';

export class NylasService {
  static basicAuthHeader = `Basic ${Buffer.from(Config.clientSecret).toString('base64')}`;

  static createAccessToken(authCode: string) {
    return axios.post<CreateAcessTokenRes>(`${Config.nylasApiUrl}/oauth/token`, {
      client_id: Config.clientId,
      client_secret: Config.clientSecret,
      grant_type: 'authorization_code',
      code: authCode,
    });
  }

  static async getEvent(deltaData: DeltaObjectData) {
    const userSnapshot = await firestore().collection('users').doc(deltaData.account_id).get();
    const eventId = deltaData.id;
    const userData = userSnapshot.data();
    const accessToken = userData?.authData?.access_token ?? '';
    const event: Event = await Nylas.with(accessToken).events.find(eventId);

    await firestore().collection('events').doc(eventId).set({
      data: event.toJSON(),
      createdAt: firestore.Timestamp.now(),
    });
  }
}
