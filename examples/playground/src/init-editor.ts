/*
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

import {editor, KeyCode, KeyMod, languages, Uri} from 'monaco-editor';
import {configureMonacoWorkers} from './configure-monaco-workers';
import packageJson from '../../../package.json';

const {name: packageName} = packageJson;

/**
 * Set up the extraLibs for the typescript-editor to do code-completion for the
 * dependencies (Google Maps and our marker library).
 */
async function initEditorFilesystem() {
  const markerLibFiles = import.meta.glob(`../../../dist/*.d.ts`, {
    as: 'raw',
    eager: true
  });

  languages.typescript.typescriptDefaults.addExtraLib(
    (await import('../node_modules/@types/google.maps/index.d.ts?raw')).default,
    `file:///node_modules/@types/google.maps/index.d.ts`
  );

  for (const [path, content] of Object.entries(markerLibFiles)) {
    const editorPath = path.replace(
      /^.*\/dist\//,
      `file:///node_modules/${packageName}/`
    );

    languages.typescript.typescriptDefaults.addExtraLib(content, editorPath);
  }
}

type CodeSample = {
  filename: string;
  title: string;
  model: editor.IModel;
};

async function loadCodeSamples(): Promise<Record<string, CodeSample>> {
  const exampleFiles = import.meta.glob('./code-samples/*.ts', {
    as: 'raw',
    eager: true
  });
  const codeSamples: Record<string, CodeSample> = {};

  for (const [path, content] of Object.entries(exampleFiles)) {
    const filename = path.replace('./code-samples/', '');
    const editorPath = `file:///${filename}`;
    const model = editor.createModel(
      content,
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

  const defaultModel = codeSampleIds[0];
  editorInstance.setModel(codeSamples[defaultModel].model);

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
      ?.run()
      .catch(err => {
        console.error('compile-and-run failed', err);
      });
  });

  editorInstance.focus();

  return editorInstance;
}
