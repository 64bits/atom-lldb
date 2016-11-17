'use babel';
import $ from 'jquery';
import fs from 'fs';

const AtomLldb = {
  breakpoints: {},
  activate (state) {
    atom.workspace.observeTextEditors(AtomLldb.activateLineClickListener);
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
    }
  }
}

export default AtomLldb;
