import {editor, languages, KeyCode, KeyMod, Uri} from 'monaco-editor';
import {decode, encode} from './snippet-encoder';
import './worker-config';

import googleMapsDTSSource from '../../node_modules/@types/google.maps/index.d.ts?raw';
import markerExampleSource from '../../examples/00.default.ts?raw';

const libModules = import.meta.glob('../../examples/lib/*.d.ts', {as: 'raw'});
const modules: Record<string, string> = {
  'node_modules/google.maps/index.d.ts': googleMapsDTSSource
};

export async function initEditor(
  runCallback: (jsCode: string) => void
): Promise<editor.IStandaloneCodeEditor> {
  const {typescript} = languages;
  const {typescriptDefaults, ScriptTarget, ModuleKind, ModuleResolutionKind} =
    typescript;

  typescriptDefaults.setEagerModelSync(true);
  typescriptDefaults.setCompilerOptions({
    target: ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: ModuleResolutionKind.NodeJs,
    module: ModuleKind.CommonJS,
    typeRoots: ['node_modules/@types']
  });

  // add typings for our marker-library and the Google Maps API
  await Promise.all(
    Object.entries(libModules).map(async ([path, module]) => {
      modules[path.replace('../../examples', '.')] = await module();
    })
  );

  for (let [path, source] of Object.entries(modules)) {
    typescriptDefaults.addExtraLib(source, `file:///${path}`);
  }

  const container = document.querySelector('#editor') as HTMLElement;
  const fileUri = Uri.parse('file:///main.ts');

  let source = markerExampleSource;
  if (location.hash) {
    console.log('loading snippet from URL.');
    const decoded = decode(location.hash.slice(1));

    const [currentMajorVersion] = API_VERSION.split('.');
    const [encodedMajorVersion] = decoded.version.split('.');

    console.info(`loaded version ${decoded.version} (current ${API_VERSION})`);

    if (import.meta.env.PROD && encodedMajorVersion !== currentMajorVersion) {
      alert(
        `The code-snippet you are loading was created with a different ` +
          `API-version (loaded: ${decoded.version} / current: ${API_VERSION}).\n\n` +
          `There might have been breaking changes.`
      );
    }

    source = decoded.code;
  }

  const model = editor.createModel(source, 'typescript', fileUri);
  const editorInstance = editor.create(container, {
    theme: 'vs-dark',
    minimap: {enabled: false},
    fontSize: import.meta.env.PROD ? 20 : 12
  });
  editorInstance.setModel(model);

  editorInstance.addAction({
    id: 'compile-and-run',
    label: 'Compile and run',
    keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
    async run(editor) {
      const worker = await typescript.getTypeScriptWorker();
      const proxy = await worker(model.uri);

      const {outputFiles} = await proxy.getEmitOutput(model.uri.toString());
      const jsCode = outputFiles[0].text;

      runCallback(jsCode);
    }
  });

  const runButton = document.querySelector('#btn-compile-and-run')!;
  runButton.addEventListener('click', () => {
    editorInstance
      .getAction('compile-and-run')
      .run()
      .then(() => {
        console.log('compie and run completed.');
      });
  });

  editorInstance.addAction({
    id: 'save-to-url',
    label: 'Save to URL',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
    run(editor) {
      const tsCode = editor.getModel()?.getValue();

      if (!tsCode) return;

      const encoded = encode({code: tsCode, version: API_VERSION});
      location.hash = encoded;
    }
  });

  editorInstance.focus();

  return editorInstance;
}
