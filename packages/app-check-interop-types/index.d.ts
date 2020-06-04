/**
 * @license
 * Copyright 2019 Google LLC
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

export interface FirebaseAppCheckInternal {
  // Get the current AttestationToken. Attaches to the most recent in-flight request if one
  // is present. Returns null if no token is present and no token requests are in-flight.
  getToken(): Promise<AppCheckToken | null>;

  // Registers a listener to changes in the token state. There can be more than one listener
  // registered at the same time for one or more FirebaseAppAttestation instances. The
  // listeners call back on the UI thread whenever the current token associated with this
  // FirebaseAppAttestation changes.
  addTokenListener(listener: AppCheckTokenListener): void;

  // Unregisters a listener to changes in the token state.
  removeTokenListener(listener: AppCheckTokenListener): void;
}

type AppCheckTokenListener = (token: AppCheckToken | null) => void;

interface AppCheckToken {
  readonly token: string;
  /**
   * Unix timestamp when AppTestation Token expires in local device time.
   */
  readonly expirationTime: number;
}

declare module '@firebase/component' {
  interface NameServiceMapping {
    'appCheckInternal': FirebaseAppCheckInternal;
  }
}
