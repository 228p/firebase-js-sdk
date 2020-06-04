/**
 * @license
 * Copyright 2017 Google LLC
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
import firebase from '@firebase/app';
import { _FirebaseNamespace } from '@firebase/app-types/private';
import { Component, ComponentType } from '@firebase/component';
import { FirebaseAppCheck } from '@firebase/app-check-types';
import { factory, internalFactory } from './factory';
import { FirebaseAppCheckInternal } from '@firebase/app-check-interop-types';

const APP_CHECK_NAME = 'appCheck';
const APP_CHECK_NAME_INTERNAL = 'appCheckInternal';
function registerAppCheck(firebase: _FirebaseNamespace): void {
  // The public interface
  firebase.INTERNAL.registerComponent(
    new Component(
      APP_CHECK_NAME,
      container => {
        // getImmediate for FirebaseApp will always succeed
        const app = container.getProvider('app').getImmediate();
        return factory(app);
      },
      ComponentType.PUBLIC
    )
  );

  // The internal interface used by other Firebase products
  firebase.INTERNAL.registerComponent(
    new Component(
      APP_CHECK_NAME_INTERNAL,
      container => {
        // getImmediate for FirebaseApp will always succeed
        const app = container.getProvider('app').getImmediate();
        return internalFactory(app);
      },
      ComponentType.PUBLIC
    )
  );
}

registerAppCheck(firebase as _FirebaseNamespace);

/**
 * Define extension behavior of `registerAnalytics`
 */
declare module '@firebase/app-types' {
  interface FirebaseNamespace {
    appCheck(app?: FirebaseApp): FirebaseAppCheck;
    appCheckInternal(): FirebaseAppCheckInternal;
  }
  interface FirebaseApp {
    appCheck(): FirebaseAppCheck;
    appCheckInternal(): FirebaseAppCheckInternal;
  }
}
