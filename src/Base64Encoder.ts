/**
 * Copyright (c) Microsoft Corporation.
 * https://github.com/microsoft/playwright/blob/main/packages/playwright-test/src/reporters/html.ts
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Transform, TransformCallback } from 'stream';

class Base64Encoder extends Transform {
  private _remainder: Buffer | undefined;

  override _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    if (this._remainder) {
      chunk = Buffer.concat([this._remainder, chunk]);
      this._remainder = undefined;
    }

    const remaining = chunk.length % 3;
    if (remaining) {
      this._remainder = chunk.slice(chunk.length - remaining);
      chunk = chunk.slice(0, chunk.length - remaining);
    }
    chunk = chunk.toString('base64');
    this.push(Buffer.from(chunk));
    callback();
  }

  override _flush(callback: TransformCallback): void {
    if (this._remainder)
      this.push(Buffer.from(this._remainder.toString('base64')));
    callback();
  }
}

export default Base64Encoder;