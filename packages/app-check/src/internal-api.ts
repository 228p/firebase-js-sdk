/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getToken as getReCAPTCHAToken } from './recaptcha';
import { FirebaseApp } from '@firebase/app-types';
import {
  AppCheckToken,
  AppCheckTokenListener
} from '@firebase/app-check-interop-types';
import { getState, setState } from './state';
import { TOKEN_REFRESH_TIME } from './constants';
import { Refresher } from './proactive-refresh';
import { ensureActivated } from './util';
import {
  exchangeToken,
  getExchangeCustomTokenRequest,
  getExchangeRecaptchaTokenRequest
} from './client';
import { writeTokenToStorage, readTokenFromStorage } from './storage';

export async function getToken(
  app: FirebaseApp,
  forceRefresh = false
): Promise<AppCheckToken | null> {
  ensureActivated(app);

  const state = getState(app);

  let token: AppCheckToken | undefined = state.token;
  // try to load token from indexedDB if it's the first time this function is called
  if (!token) {
    const cachedToken = await readTokenFromStorage(app);
    if (cachedToken && isValid(cachedToken)) {
      token = cachedToken;

      setState(app, { ...state, token });
      // notify all listeners with the cached token
      notifyTokenListeners(app, token);
    }
  }
  // return the cached token if it's valid
  if (!forceRefresh && token && isValid(token)) {
    return token;
  }

  // request new token
  if (state.customProvider) {
    const attestedClaimsToken = await state.customProvider.getToken();
    token = await exchangeToken(
      getExchangeCustomTokenRequest(app, attestedClaimsToken)
    );
  } else {
    const attestedClaimsToken = await getReCAPTCHAToken(app);
    token = await exchangeToken(
      getExchangeRecaptchaTokenRequest(app, attestedClaimsToken)
    );
  }

  // write the new token to the memory state as well as the persistent storage
  setState(app, { ...state, token });
  await writeTokenToStorage(app, token);

  notifyTokenListeners(app, token);

  return token;
}

export function addTokenListener(
  app: FirebaseApp,
  listener: AppCheckTokenListener
): void {
  const state = getState(app);
  const newState = {
    ...state,
    tokenListeners: [...state.tokenListeners, listener]
  };

  if (!newState.tokenRefresher) {
    const tokenRefresher = createTokenRefresher(app);
    newState.tokenRefresher = tokenRefresher;
  }

  if (!newState.tokenRefresher.isRunning()) {
    newState.tokenRefresher.start();
  }

  // invoke the listener async immediately if there is a valid token
  if (state.token && isValid(state.token)) {
    const validToken = state.token;
    Promise.resolve().then(() => listener(validToken));
  }

  setState(app, newState);
}

export function removeTokenListener(
  app: FirebaseApp,
  listener: AppCheckTokenListener
): void {
  const state = getState(app);

  const newListeners = state.tokenListeners.filter(l => l !== listener);
  if (
    newListeners.length === 0 &&
    state.tokenRefresher &&
    state.tokenRefresher.isRunning()
  ) {
    state.tokenRefresher.stop();
  }

  setState(app, {
    ...state,
    tokenListeners: newListeners
  });
}

function createTokenRefresher(app: FirebaseApp): Refresher {
  return new Refresher(
    // Keep in mind when this fails for any reason other than the ones
    // for which we should retry, it will effectively stop the proactive refresh.
    () => {
      const state = getState(app);
      // If there is no token, we will try to load it from storage and use it
      // If there is a token, we force refresh it because we know it's going to expire soon
      if (!state.token) {
        return getToken(app);
      } else {
        return getToken(app, true);
      }
    },
    () => {
      // TODO: when should we retry?
      return true;
    },
    () => {
      const state = getState(app);

      if (state.token) {
        return Math.max(
          0,
          state.token.expirationTime -
            Date.now() -
            TOKEN_REFRESH_TIME.OFFSET_DURATION
        );
      } else {
        return 0;
      }
    },
    TOKEN_REFRESH_TIME.RETRIAL_MIN_WAIT,
    TOKEN_REFRESH_TIME.RETRIAL_MAX_WAIT
  );
}

function notifyTokenListeners(app: FirebaseApp, token: AppCheckToken): void {
  const listeners = getState(app).tokenListeners;

  for (const listener of listeners) {
    try {
      listener(token);
    } catch (e) {
      // If any handler fails, ignore and run next handler.
    }
  }
}

function isValid(token: AppCheckToken): boolean {
  return token.expirationTime - Date.now() > 0;
}
