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

import '../test/setup';
import { writeTokenToStorage, readTokenFromStorage } from './storage';
import { getFakeApp } from '../test/util';
import * as util from './util';
import { expect } from 'chai';
import { stub } from 'sinon';

describe.only('Storage', () => {
  const app = getFakeApp();
  const fakeToken = {
    token: 'fake-app-check-token',
    expirationTime: 123
  };

  it('sets and gets appCheck token to indexeddb', async () => {
    await writeTokenToStorage(app, fakeToken);
    expect(await readTokenFromStorage(app)).to.deep.equal(fakeToken);
  });

  it('no op for writeTokenToStorage() if indexeddb is not available', async () => {
    stub(util, 'isIndexedDBAvailable').returns(false);
    await writeTokenToStorage(app, fakeToken);
    expect(await readTokenFromStorage(app)).to.equal(undefined);
  });

  it('resolves with undefined if indexeddb is not available', async () => {
    stub(util, 'isIndexedDBAvailable').returns(false);
    expect(await readTokenFromStorage(app)).to.equal(undefined);
  });
});
