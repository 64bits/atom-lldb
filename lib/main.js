'use babel';
import $ from 'jquery';
import fs from 'fs';
import child_process from 'child_process';

// Represents the REPL and I/O
class Lldb {
  constructor() {
    this.history = [];
    this.$container = $('<lldb-panel></lldb-panel>');
    this.$output = $('<lldb-output></lldb-output>');
    this.$input = $('<textarea class="native-key-bindings" tab-index="-1" id="lldb-input"></textarea>');
    this.$container.append(this.$output);
    this.$container.append(this.$input);
    this.lldb = this.spawnDebugger();
    this.registerPipeline(this.lldb.stdout);
    this.registerPipeline(this.lldb.stderr);
    this.$input.keydown((event) => {
      if(event.which === 13) {
        event.preventDefault();
        this.lldb.stdin.write(`${this.$input.val()}\n`);
        this.$input.val('');
      }
    });
  }

  processInput (command) {
    this.lldb.stdin.write(`${command}\n`);
    this.$input.val('');
  }

  spawnDebugger () {
    var lldb = child_process.spawn('lldb');
    // lldb.on('close', (code) => {
    //   console.log(`child process exited with code ${code}`);
    // });
    return lldb;
  }

  registerPipeline(pipe) {
    pipe.on('data', (data) => {
      this.history.push(data);
      this.$output.append($(`<p>${data}</p>`));
      //this.$output.scrollTop(this.$output.prop('scrollHeight'));
    });
  }

  static render(lldb) {
    return lldb.$container[0];
  }
}

const AtomLldb = {
  counter: 0,
  lldb: null,
  lldbinitPath: '/Users/rohit/UnityDev/unity/.lldbinit',
  breakpoints: {},
  activate (state) {
    atom.workspace.observeTextEditors(AtomLldb.activateLineClickListener);
    atom.views.addViewProvider(Lldb, Lldb.render);
    AtomLldb.testBottomPanel();
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
        marker['breakpointIndex'] = ++(AtomLldb.counter);
        AtomLldb.lldb.processInput(`breakpoint set -f ${filePath} -l ${lineNumber}`);
        AtomLldb.breakpoints[filePath][lineNumber] = marker;
      } else {
        // Breakpoint exists, remove
        AtomLldb.lldb.processInput(`breakpoint delete ${AtomLldb.breakpoints[filePath][lineNumber]['breakpointIndex']}`);
        AtomLldb.breakpoints[filePath][lineNumber].destroy();
        delete AtomLldb.breakpoints[filePath][lineNumber];
      }
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
  testBottomPanel () {
    AtomLldb.lldb = new Lldb();
    atom.workspace.addBottomPanel({item: AtomLldb.lldb});
  }
}

export default AtomLldb;
