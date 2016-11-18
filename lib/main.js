'use babel';
import $ from 'jquery';
import fs from 'fs';
import child_process from 'child_process';

const AtomLldb = {
  lldbinitPath: '/Users/rohit/UnityDev/unity/.lldbinit',
  breakpoints: {},
  activate (state) {
    atom.workspace.observeTextEditors(AtomLldb.activateLineClickListener);
    AtomLldb.testChildProcess();
    // atom.commands.add('atom-workspace', {
    //   'atom-lldb:create-breakpoint': AtomLldb.createBreakpoint
    // });
    // console.log(fs.readFileSync('/Users/rohit/.atom/packages/atom-lldb/package.json', 'utf8'));
  },
  activateLineClickListener (editor) {
    var view = atom.views.getView(editor);
    view.shadowRoot.addEventListener('click', (event) =>
      { AtomLldb.lineClickCallback(editor, event) },
      true);
  },
  lineClickCallback (editor, event) {
    if($(event.target).hasClass('line-number')) {
      var arrIndex;
      var filePath = editor.buffer.file.path;
      var lineNumber = parseInt(event.target.innerText, 10);
      if(!AtomLldb.breakpoints.hasOwnProperty(filePath)) {
        AtomLldb.breakpoints[filePath] = {};
      }

      if(!AtomLldb.breakpoints[filePath].hasOwnProperty(lineNumber)) {
        // Breakpoint doesn't exist, create
        var marker = editor.markBufferRange([[lineNumber-1,lineNumber],[lineNumber-1,lineNumber]]);
        editor.decorateMarker(marker, {type: 'line-number', class: 'atom-lldb-breakpoint'});
        AtomLldb.breakpoints[filePath][lineNumber] = marker;
      } else {
        // Breakpoint exists, remove
        AtomLldb.breakpoints[filePath][lineNumber].destroy();
        delete AtomLldb.breakpoints[filePath][lineNumber];
      }

      AtomLldb.writeLldbInit();
    }
  },
  writeLldbInit () {
    var fileContents = '';
    Object.keys(AtomLldb.breakpoints).forEach((path) => {
      Object.keys(AtomLldb.breakpoints[path]).forEach((line) => {
        fileContents += `breakpoint set -f ${path} -l ${line}\r\n`;
      });
    });
    fs.writeFile(AtomLldb.lldbinitPath, fileContents, 'utf8');
  },
  testChildProcess () {
    var lldb = child_process.spawn('lldb');
    lldb.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    lldb.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
    lldb.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    lldb.stdin.write('help\n');
  }
}

export default AtomLldb;
