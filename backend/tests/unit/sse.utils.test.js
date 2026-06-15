import { describe, expect, it, jest } from '@jest/globals';
import { setupSSE } from '../../src/utils/sse.utils.js';

describe('sse.utils.js', () => {
  describe('setupSSE', () => {
    it('sets SSE headers and returns onChunk function', () => {
      const res = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn()
      };

      const onChunk = setupSSE(res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();

      // Test onChunk
      onChunk('test data');
      expect(res.write).toHaveBeenCalledWith(`data: {"type":"chunk","content":"test data"}\n\n`);
    });
  });
});
