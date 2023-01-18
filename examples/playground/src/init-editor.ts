import {editor, KeyCode, KeyMod, languages, Uri} from 'monaco-editor';
import {decode, encode} from './snippet-encoder';

import packageJson from '../../../package.json';

const {name: packageName}: {name: string} = packageJson as never;

import './configure-monaco-workers';

import {configureMonacoWorkers} from './configure-monaco-workers';

/**
 * Set up the extraLibs for the typescript-editor to do code-completion for the
 * dependencies (Google Maps and our marker library).
 */
async function initEditorFilesystem() {
  const markerLibFiles = import.meta.glob(`../../../dist/*.d.ts`, {as: 'raw'});

  languages.typescript.typescriptDefaults.addExtraLib(
    (await import('../node_modules/@types/google.maps/index.d.ts?raw')).default,
    `file:///node_modules/@types/google.maps/index.d.ts`
  );

  for (const [path, loadFile] of Object.entries(markerLibFiles)) {
    const editorPath = path.replace(
      /^.*\/dist\//,
      `file:///node_modules/${packageName}/`
    );

    languages.typescript.typescriptDefaults.addExtraLib(
      await loadFile(),
      editorPath
    );
  }
}

type CodeSample = {
  filename: string;
  title: string;
  model: editor.IModel;
};

async function loadCodeSamples(): Promise<Record<string, CodeSample>> {
  const exampleFiles = import.meta.glob('./code-samples/*.ts', {as: 'raw'});
  const codeSamples: Record<string, CodeSample> = {};

  for (const [path, loadFile] of Object.entries(exampleFiles)) {
    const filename = path.replace('./code-samples/', '');
    const editorPath = `file:///${filename}`;
    const model = editor.createModel(
      await loadFile(),
      'typescript',
      Uri.parse(editorPath)
    );

    const firstLine = model.getLineContent(1);
    let title = filename;
    if (firstLine.startsWith('// title:')) {
      title = firstLine.replace(/\/\/ title:\s*/, '');
    }

    codeSamples[filename] = {filename, title, model};
  }

  return codeSamples;
}

/**
 * Load code from url-parameters and validate the version against the current
 * version.
 */
function createModelFromUrl(): editor.IModel | null {
  if (!location.hash) {
    return null;
  }

  console.log('loading snippet from URL.');
  const {code, version} = decode(location.hash.slice(1));

  const [currentMajorVersion] = API_VERSION.split('.');
  const [encodedMajorVersion] = version.split('.');

  console.info(`loaded version ${version} (current ${API_VERSION})`);

  if (import.meta.env.PROD && encodedMajorVersion !== currentMajorVersion) {
    alert(
      `The code-snippet you are loading was created with a different ` +
        `API-version (loaded: ${version} / current: ${API_VERSION}).\n\n` +
        `There might have been breaking changes.`
    );
  }

  return editor.createModel(
    code,
    'typescript',
    Uri.parse('file:///example.ts')
  );
}

function createEditorActions(
  editorInstance: editor.IStandaloneCodeEditor,
  runCallback: (jsCode: string) => Promise<void>
) {
  editorInstance.addAction({
    id: 'compile-and-run',
    label: 'Compile and run',
    keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
    async run() {
      const model = editorInstance.getModel();

      if (!model) {
        console.error('compile-and-run: no editor-model found.');
        return;
      }

      const worker = await languages.typescript.getTypeScriptWorker();
      const proxy = await worker(model.uri);

      const {outputFiles} = await proxy.getEmitOutput(model.uri.toString());
      const jsCode = outputFiles[0].text;

      await runCallback(jsCode);
    }
  });

  editorInstance.addAction({
    id: 'save-to-url',
    label: 'Save to URL',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
    run(editor) {
      const tsCode = editor.getModel()?.getValue();

      if (!tsCode) return;

      location.hash = encode({code: tsCode, version: API_VERSION});
    }
  });
}

function configureTypescriptDefaults() {
  languages.typescript.typescriptDefaults.setEagerModelSync(true);
  languages.typescript.typescriptDefaults.setCompilerOptions({
    target: languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: languages.typescript.ModuleResolutionKind.NodeJs,
    module: languages.typescript.ModuleKind.CommonJS,
    typeRoots: ['node_modules/@types']
  });
}

export async function initEditor(
  runCallback: (jsCode: string) => Promise<void>
): Promise<editor.IStandaloneCodeEditor> {
  configureMonacoWorkers();
  configureTypescriptDefaults();

  await initEditorFilesystem();
  const userCodeModel = createModelFromUrl();
  const codeSamples = await loadCodeSamples();

  const editorContainer = document.querySelector('#editor') as HTMLElement;
  const runButton = document.querySelector(
    '#btn-compile-and-run'
  ) as HTMLElement;

  // create editor-instance
  const editorInstance = editor.create(editorContainer, {
    minimap: {enabled: false},
    fontSize: import.meta.env.PROD ? 20 : 12
  });

  const codeSampleIds = Object.keys(codeSamples);

  if (codeSampleIds.length === 0) {
    throw new Error('failed to load editor models');
  }

  const defaultModel = codeSampleIds.at(0) as string;
  editorInstance.setModel(userCodeModel || codeSamples[defaultModel].model);

  // populate examples dropdown
  const exampleSelect = document.querySelector(
    '#example-select'
  ) as HTMLSelectElement;

  exampleSelect.innerHTML = '';
  for (const [id, {title}] of Object.entries(codeSamples)) {
    const el = document.createElement('option');
    el.textContent = title;
    el.value = id;

    exampleSelect.appendChild(el);
  }

  exampleSelect.addEventListener('change', () => {
    const modelId = exampleSelect.value;

    editorInstance.setModel(codeSamples[modelId].model);
    editorInstance.focus();
  });

  createEditorActions(editorInstance, runCallback);

  runButton.addEventListener('click', () => {
    editorInstance
      .getAction('compile-and-run')
      .run()
      .catch(err => {
        console.error('compile-and-run failed', err);
      });
  });

  editorInstance.focus();

  return editorInstance;
}
