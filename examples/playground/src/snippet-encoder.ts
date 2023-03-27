/**
 * Copyright 2023 Google LLC
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

export type SavedCodeSnippetData = {code: string; version: string};

export function encode(data: SavedCodeSnippetData): string {
  const {code, version} = data;

  const p = new URLSearchParams();
  p.set('v', version);
  p.set('c', window.btoa(code));

  return p.toString();
}

export function decode(encoded: string): SavedCodeSnippetData {
  const p = new URLSearchParams(encoded);

  const base64 = p.get('c');
  const version = p.get('v') || '0.0.0';

  if (!base64) {
    return {version, code: ''};
  }

  return {code: window.atob(base64), version};
}
