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

export interface FirebaseAppCheck {
  /**
   * Provide a custom attestation provider implementation
   */
  setCustomProvider(provider: AppCheckProvider): void;

  /**
   * Activate AppCheck
   */
  activate(): void;
}

interface AppCheckProvider {
  /**
   * returns a AppCheckProvider Token, e.g. reCAPTCHA token
   * We will use this token to exchange for the Firebase AppCheckToken
   */
  getToken(): Promise<string>;
}

declare module '@firebase/component' {
  interface NameServiceMapping {
    'appCheck': FirebaseAppCheck;
  }
}