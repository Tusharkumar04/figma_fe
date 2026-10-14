import WebSocket from 'ws';

async function testConcurrentEditing() {
  console.log('Testing concurrent document editing over WebSocket...');
  const wsUrl = 'ws://localhost:4000';

  const clientA = new WebSocket(wsUrl);
  const clientB = new WebSocket(wsUrl);

  let clientBReceivedChange = false;
  let receivedData = null;

  await new Promise((resolve, reject) => {
    let count = 0;
    const onOpen = () => {
      count++;
      if (count === 2) resolve(true);
    };
    clientA.on('open', onOpen);
    clientB.on('open', onOpen);
    clientA.on('error', reject);
    clientB.on('error', reject);
  });

  clientB.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'doc_change' && parsed.nodeId === 'node_card_hero') {
        clientBReceivedChange = true;
        receivedData = parsed;
      }
    } catch (e) {}
  });

  // Both join the same document room
  clientA.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_alice' }));
  clientB.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_bob' }));

  await new Promise((r) => setTimeout(r, 200));

  // Client A commits a document change (e.g. moving a shape)
  clientA.send(JSON.stringify({
    type: 'doc_change',
    documentId: 'demo-doc',
    userId: 'user_alice',
    nodeId: 'node_card_hero',
    change: { transform: { x: 300, y: 150, width: 400, height: 250, rotation: 0 } },
  }));

  await new Promise((r) => setTimeout(r, 400));

  clientA.close();
  clientB.close();

  if (clientBReceivedChange && receivedData) {
    console.log('[PASS] Concurrent document edit broadcast and received by peer session');
    process.exit(0);
  } else {
    console.error('[FAIL] Peer session did not receive doc_change');
    process.exit(1);
  }
}

testConcurrentEditing();
