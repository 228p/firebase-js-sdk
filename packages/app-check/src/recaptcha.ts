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

import { FirebaseApp } from '@firebase/app-types';
import { getState, setState } from './state';
import { Deferred } from '@firebase/util';
import { getRecaptcha } from './util';

export const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api.js';

export function initialize(app: FirebaseApp): Promise<GreCAPTCHA> {
  const state = getState(app);
  const initialized = new Deferred<GreCAPTCHA>();

  setState(app, { ...state, reCAPTCHAState: { initialized } });

  const divId = `fire_app_check_${app.name}`;
  const invisibleDiv = document.createElement('div');
  invisibleDiv.id = divId;
  invisibleDiv.style.display = 'none';

  document.body.appendChild(invisibleDiv);

  const grecaptcha = getRecaptcha();
  if (!grecaptcha) {
    loadReCAPTCHAScript(() => {
      const grecaptcha = getRecaptcha();

      if (!grecaptcha) {
        // it shouldn't happen.
        throw new Error('no recaptcha');
      }
      grecaptcha.ready(() => {
        // Invisible widgets allow us to set a different siteKey for each widget, so we use them to can support multiple apps
        renderInvisibleWidget(app, divId);
        initialized.resolve(grecaptcha);
      });
    });
  } else {
    grecaptcha.ready(() => {
      renderInvisibleWidget(app, divId);
      initialized.resolve(grecaptcha);
    });
  }

  return initialized.promise;
}

export async function getToken(app: FirebaseApp): Promise<string> {
  const reCAPTCHAState = getState(app).reCAPTCHAState;

  // it shouldn't happen
  if (!reCAPTCHAState) {
    throw Error(`App Check has not been activated for ${app.name}`);
  }

  const recaptcha = await reCAPTCHAState.initialized.promise;

  return new Promise((resolve, _reject) => {
    recaptcha.ready(() => {
      resolve(
        // widgetId is guaranteed to be available if reCAPTCHAState.initialized.promise resolved.
        recaptcha.execute(reCAPTCHAState.widgetId!, {
          action: 'fire_app_check'
        })
      );
    });
  });
}

/**
 *
 * @param app
 * @param container - Id of a HTML element.
 */
function renderInvisibleWidget(app: FirebaseApp, container: string): void {
  const grecaptcha = getRecaptcha();

  // it shouldn't happen.
  if (!grecaptcha) {
    throw new Error('no recaptcha');
  }
  const widgetId = grecaptcha.render(container, {
    // TODO: confirm how we get siteKey.
    // Should we retrieve it dynamically? probably not, since it will add significant latency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sitekey: (app.options as any).siteKey,
    size: 'invisible'
  });

  const state = getState(app);
  // state.reCAPTCHAState is set in the beginning of the function
  state.reCAPTCHAState!.widgetId = widgetId;

  setState(app, state);
}

function loadReCAPTCHAScript(onload: () => void): void {
  const script = document.createElement('script');
  script.src = `${RECAPTCHA_URL}`;
  script.onload = onload;
  document.head.appendChild(script);
}

declare global {
  interface Window {
    grecaptcha: GreCAPTCHA | undefined;
  }
}

export interface GreCAPTCHA {
  ready: (callback: Function) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
  render: (
    container: string | HTMLElement,
    parameters: GreCAPTCHARenderOption
  ) => string;
}

export interface GreCAPTCHARenderOption {
  sitekey: string;
  size: 'invisible';
}
