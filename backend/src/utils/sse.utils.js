export function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onChunk = (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
  };

  return onChunk;
}
