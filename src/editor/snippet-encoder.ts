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
