import * as monaco from 'monaco-editor';
import './monaco-config';

import markerDTSSource from '../../examples/lib/marker.d.ts?raw';
import colorDTSSource from '../../examples/lib/color.d.ts?raw';
import iconsDTSSource from '../../examples/lib/icons.d.ts?raw';
import googleMapsDTSSource from '../../node_modules/@types/google.maps/index.d.ts?raw';

import markerExampleSource from '../../examples/00.default.ts?raw';

const modules = {
  'lib/marker.d.ts': markerDTSSource,
  'lib/color.f.ts': colorDTSSource,
  'lib/icons.d.ts': iconsDTSSource,
  'node_modules/google.maps/index.d.ts': googleMapsDTSSource
};

export async function initEditor(
  runCallback: (jsCode: string) => void
): Promise<monaco.editor.IStandaloneCodeEditor> {
  let {typescriptDefaults} = monaco.languages.typescript;
  typescriptDefaults.setEagerModelSync(true);
  typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    typeRoots: ['node_modules/@types']
  });

  // add typings for our marker-library and the google maps API
  for (let [path, source] of Object.entries(modules)) {
    typescriptDefaults.addExtraLib(source, `file:///${path}`);
  }

  const container = document.querySelector('#editor') as HTMLElement;
  const fileUri = monaco.Uri.parse('file:///main.ts');

  let source = markerExampleSource;
  if (location.hash && location.hash.startsWith('#c=')) {
    source = atob(location.hash.slice(3));
  }

  const model = monaco.editor.createModel(source, 'typescript', fileUri);
  const editor = monaco.editor.create(container, {
    theme: 'vs-dark',
    minimap: {enabled: false},
    fontSize: import.meta.env.PROD ? 20 : 12
  });
  editor.setModel(model);

  editor.addAction({
    id: 'compile-and-run',
    label: 'Compile and run',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    async run(editor) {
      const worker = await monaco.languages.typescript.getTypeScriptWorker();
      const proxy = await worker(model.uri);

      const {outputFiles} = await proxy.getEmitOutput(model.uri.toString());
      const jsCode = outputFiles[0].text;

      runCallback(jsCode);
    }
  });

  const runButton = document.querySelector('#btn-compile-and-run')!;
  runButton.addEventListener('click', () => {
    editor
      .getAction('compile-and-run')
      .run()
      .then(() => {
        console.log('compie and run completed.');
      });
  });

  editor.addAction({
    id: 'save-to-url',
    label: 'Save to URL',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run(editor) {
      const tsCode = editor.getModel()?.getValue();

      if (!tsCode) return;

      const base64 = btoa(tsCode);
      location.hash = 'c=' + base64;
    }
  });

  editor.focus();

  return editor;
}
