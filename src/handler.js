class PageHandler {
  static __generateNodeIndexPath(node) {
    if (!node || !node.parentNode) {
      return "";
    }

    const parent = node.parentNode;
    const index = Array.from(parent.childNodes).indexOf(node);

    return this.__generateNodeIndexPath(parent) + "-" + index;
  }

  static __getNodeIndexPath(node) {
    return this.__generateNodeIndexPath(node).slice(1);
  }

  static __getNodeByIndexPath(path) {
    const indexes = path.split("-").map(Number);
    let node = document;

    for (let i = 0; i < indexes.length; i++) {
      node = node.childNodes[indexes[i]];
      if (!node) {
        console.error("Invalid path:", path);
        return null;
      }
    }

    return node;
  }

  static getScrollPosition() {
    return document.documentElement.scrollTop;
  }

  static setScrollPosition(scrollPosition) {
    document.documentElement.scrollTop = scrollPosition;
  }

  static getTextSelection() {
    const selection = window.getSelection();

    if (selection.rangeCount == 0) return {};

    const selectionRange = window.getSelection().getRangeAt(0);

    return {
      startContainer: this.__getNodeIndexPath(selectionRange.startContainer),
      endContainer: this.__getNodeIndexPath(selectionRange.endContainer),
      startOffset: selectionRange.startOffset,
      endOffset: selectionRange.endOffset,
    };
  }

  static setTextSelection({
    startContainer,
    endContainer,
    startOffset,
    endOffset,
  }) {
    const startElement = this.__getNodeByIndexPath(startContainer);
    const endElement = this.__getNodeByIndexPath(endContainer);

    const range = document.createRange();
    range.setStart(startElement, startOffset);
    range.setEnd(endElement, endOffset);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  static getState() {
    return {
      scrollPosition: this.getScrollPosition(),
      selectionRange: this.getTextSelection(),
    };
  }

  static setState({ scrollPosition, selectionRange }) {
    this.setScrollPosition(scrollPosition);
    this.setTextSelection(selectionRange);
  }
}

browser.runtime.onMessage.addListener(function (
  { action, data },
  _,
  sendResponse,
) {
  switch (action) {
    case "getPageMarkData":
      const state = PageHandler.getState();
      sendResponse({
        scrollPosition: state.scrollPosition,
        selectionRange: JSON.stringify(state.selectionRange),
      });
      break;
    case "loadPageMark":
      PageHandler.setState({
        scrollPosition: data.scrollPosition,
        selectionRange: JSON.parse(data.selectionRange),
      });
      break;
    default:
      console.log("[handler.js]: Invalid Action!!!");
  }
});
