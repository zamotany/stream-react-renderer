/* @flow */

import readline from 'readline';
import enhanceConsole from '../effects/enhanceConsole';
import {
  hideCursor,
  clearOnExit,
  clearScrollBackOnExit,
} from '../effects/terminal';
import ChunkNode from './ChunkNode';
import { mergeCanvas, getCanvas } from '../utils/layout';

import type { Element } from '../types';

type Options = {
  // @TODO: add clearOnExit option
  debug: boolean,
  hideCursor: boolean,
  clearOnExit: boolean,
  clearScrollBackOnExit: boolean,
  exitOnWarning: boolean,
  exitOnError: boolean,
};

export default class ContainerNode {
  children: ChunkNode[] = [];
  elements: Element[] = [];
  frontBuffer: string = '';
  backBuffer: string = '';
  stream: any = null;
  options: Options;
  canvasSize: { width: number, height: number };

  constructor(stream: any, opts?: Options) {
    this.options = {
      debug: false,
      exitOnError: false,
      exitOnWarning: false,
      hideCursor: false,
      clearOnExit: false,
      clearScrollBackOnExit: false,
      ...(opts || {}),
    };
    this.stream = stream;

    this.canvasSize = {
      width: this.stream.columns,
      height: this.stream.rows - 1,
    };

    enhanceConsole({
      exitOnError: this.options.exitOnError,
      exitOnWarning: this.options.exitOnWarning,
    });

    if (this.options.hideCursor) {
      hideCursor(this.stream);
    }

    if (this.options.clearOnExit) {
      clearOnExit(this.stream);
    }

    if (this.options.clearScrollBackOnExit) {
      clearScrollBackOnExit(this.stream);
    }
  }

  invalidateParent = () => {
    /* NOOP */
  };

  appendChild(child: ChunkNode) {
    // eslint-disable-next-line no-param-reassign
    child.parent = this;
    this.children.push(child);
  }

  prependChild(child: ChunkNode, childBefore: ChunkNode) {
    // eslint-disable-next-line no-param-reassign
    child.parent = this;
    const index = this.children.indexOf(childBefore);
    this.children.splice(index, 0, child);
  }

  removeChild(child: ChunkNode) {
    const index = this.children.indexOf(child);
    this.children.splice(index, 1);
  }

  appendElement(element: Element) {
    this.elements.push(element);
  }

  diffBuffers() {
    if (!this.options.renderOptimizations || !this.backBuffer.length) {
      return 0;
    }

    const backBuffer = this.backBuffer.split('\n');
    const frontBuffer = this.frontBuffer.split('\n');

    let index = 0;
    for (const frontLine of frontBuffer) {
      if (backBuffer[index] !== frontLine) {
        break;
      }
      index++;
    }

    return index;
  }

  // withDebugInfo(body: string, { splitPoint }: { splitPoint: number }) {
  //   let debugInfo = `${'='.repeat(10)} DEBUG ${'='.repeat(10)}\n`;
  //   debugInfo += `  frontBuffer.length: ${this.backBuffer.length}\n`;
  //   debugInfo += `  backBuffer.length: ${this.frontBuffer.length}\n`;
  //   debugInfo += `  renderOptimizations: ${this.options.renderOptimizations
  //     ? 'enabled'
  //     : 'disabled'}\n`;
  //   debugInfo += `  frontBuffer splitPoint: ${splitPoint}\n`;
  //   return `${body}\n\n${debugInfo}`;
  // }

  getOutput(splitPoint?: number) {
    let body;
    if (splitPoint) {
      body = `${this.frontBuffer
        .split('\n')
        .slice(splitPoint)
        .join('\n')}\n`;
    } else {
      body = `${this.frontBuffer}\n`;
    }

    // if (this.options.debug) {
    //   return this.withDebugInfo(body, { splitPoint: splitPoint || 0 });
    // }
    return body;
  }

  flush() {
    // @TODO: this buffer/optimization/slitting logic needs to be refactored
    this.backBuffer = this.frontBuffer.split('\n').join('\n');
    this.elements = [];

    const canvas = getCanvas(this.canvasSize);
    this.frontBuffer = mergeCanvas(
      canvas,
      this.children.reduce(
        (acc, child) => [...acc, ...child.render(canvas)],
        []
      )
    ).join('\n');

    if (this.backBuffer === this.frontBuffer) {
      return;
    }

    const splitPoint = this.diffBuffers();

    readline.cursorTo(this.stream, 0, splitPoint);
    readline.clearScreenDown(this.stream);
    this.stream.write(this.getOutput(splitPoint));
  }
}
