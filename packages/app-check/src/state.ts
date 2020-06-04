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
import { AppCheckProvider } from '@firebase/app-check-types';
import { AppCheckTokenListener } from '@firebase/app-check-interop-types';

export interface AppCheckState {
  activated: boolean;
  customProvider?: AppCheckProvider;
}

export const APP_CHECK_STATES = new Map<FirebaseApp, AppCheckState>();
export const DEFAULT_STATE: AppCheckState = {
  activated: false
};
export const APP_CHECK_LISTENERS = new Map<
  FirebaseApp,
  AppCheckTokenListener
>();
