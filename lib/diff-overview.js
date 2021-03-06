"use strict";
const ramda = require('ramda');
const types_1 = require('./types');
const CompositeDisposable = require('atom').CompositeDisposable;
function init() {
    atom.workspace.observeTextEditors(editor => {
        let subscriptions = new CompositeDisposable();
        subscriptions.add(editor.onDidStopChanging(e => update(editor)));
        subscriptions.add(editor.onDidChangePath(e => update(editor)));
        subscriptions.add(editor.onDidDestroy(e => subscriptions.dispose()));
    });
}
exports.init = init;
function bar(editor) {
    let bar = atom.views.getView(editor).component.domNodeValue.querySelector('.diff-overview');
    if (!bar) {
        bar = document.createElement('div');
        bar.classList.add('diff-overview');
        atom.views.getView(editor).component.domNodeValue.appendChild(bar);
    }
    return bar;
}
function isSameRepo(repoPath, filePath) {
    if (!filePath) {
        return false;
    }
    let repoRoot = repoPath.replace('.git', '');
    return filePath.indexOf(repoRoot) === 0;
}
function clear(editor) {
    bar(editor).innerHTML = '';
}
function set(editor, diff, type) {
    let displayHeight = editor.displayBuffer.height;
    let rowCount = editor.getScreenLineCount();
    let rowHeight = displayHeight / rowCount;
    let beginRow = diff.newStart - 1;
    let endRow = type === 'removed' ? beginRow + 1 : diff.newStart + diff.newLines - 1;
    let item = document.createElement('div');
    item.classList.add(type);
    item.style.top = `${Math.round(beginRow * rowHeight)}px`;
    item.style.height = `${Math.round((endRow - beginRow) * rowHeight)}px`;
    bar(editor).appendChild(item);
}
function update(editor) {
    const isAdded = diff => diff.oldLines === 0 && diff.newLines > 0;
    const isRemoved = diff => diff.newLines === 0 && diff.oldLines > 0;
    const isModified = diff => !isAdded(diff) && !isRemoved(diff);
    clear(editor);
    types_1.Optional.of(ramda.head(atom.project.getRepositories().filter(repo => repo && isSameRepo(repo.getPath(), editor.getPath()))))
        .map(repo => repo.getLineDiffs(editor.getPath(), editor.getText()))
        .map((diffs) => {
        diffs.filter(isAdded).forEach(diff => set(editor, diff, 'added'));
        diffs.filter(isRemoved).forEach(diff => set(editor, diff, 'removed'));
        diffs.filter(isModified).forEach(diff => set(editor, diff, 'modified'));
    });
}
