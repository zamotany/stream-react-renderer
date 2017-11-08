/* @flow */

import TextNode from '../nodes/TextNode';

/* eslint-disable no-param-reassign */

export function getCanvas({ width, height }: { [key: string]: number }) {
  const canvas = [];
  for (let i = 0; i < height; i++) {
    canvas.push(' '.repeat(width));
  }
  return canvas;
}

export function mergeCanvas(canvas: string[], relativeCanvas: string[]) {
  // We only care about canvas.length since it should be max number or terminal's rows.
  const finalCanvas = [];
  const noContentLine = ' '.repeat(canvas[0].length);
  for (let lineIndex = 0; lineIndex < canvas.length; lineIndex++) {
    finalCanvas[lineIndex] =
      canvas[lineIndex] === noContentLine && relativeCanvas[lineIndex]
        ? relativeCanvas[lineIndex]
        : canvas[lineIndex];
  }
  return finalCanvas;
}

export function appendToLastLine(canvas: string[], text: string) {
  const index = (canvas.length || 1) - 1;
  canvas[index] = `${canvas[index] || ''}${text}`;
}

export function appendTextNode(canvas: string[], node: TextNode) {
  const hasNewLine = node.props.children.indexOf('\n') > -1;
  if (!hasNewLine) {
    appendToLastLine(canvas, node.props.children);
  } else {
    const textLines = node.props.children.split('\n');
    textLines.forEach((text, i) => {
      appendToLastLine(canvas, text);
      if (i !== textLines.length - 1) {
        canvas.push('');
      }
    });
  }
}

export function appendRenderResults(
  canvas: string[],
  renderResults: string[],
  { isInline }: { isInline: boolean }
) {
  renderResults.forEach((text, i) => {
    if (i === 0 && isInline) {
      appendToLastLine(canvas, text);
    } else {
      canvas.push(text);
    }
  });
  if (!isInline) {
    canvas.push('');
  }
}

export function appendOffsets(
  canvas: string[],
  { top, bottom, left, right }: { [key: string]: number },
  { width }: { width?: number } = {}
) {
  for (let i = 0; i < canvas.length; i++) {
    canvas[i] = `${' '.repeat(left)}${canvas[i]}${' '.repeat(right)}`;
  }
  for (let i = 0; i < top + bottom; i++) {
    // $FlowFixMe
    canvas[i < top ? 'unshift' : 'push'](width ? ' '.repeat(width) : '');
  }
}

export function normalize(
  canvas: string[],
  { width, height }: { [key: string]: ?number }
) {
  if (width) {
    for (let i = 0; i < canvas.length; i++) {
      canvas[i] = canvas[i].substr(0, width || canvas[i].length);
      canvas[i] += ' '.repeat((width || canvas[i].length) - canvas[i].length);
    }
  }

  if (height && canvas.length < height) {
    const length = height - canvas.length;
    for (let i = 0; i < length; i++) {
      canvas.push(width ? ' '.repeat(width) : '');
    }
  } else if (height && canvas.length > height) {
    for (let i = 0; i < canvas.length - height; i++) {
      canvas.pop();
    }
  }
}

export function layAbsoluteTextNode(canvas: string[], node: TextNode) {}