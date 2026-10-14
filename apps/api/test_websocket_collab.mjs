import WebSocket from 'ws';

async function testWebSocket() {
  console.log('Testing WebSocket collaboration gateway...');
  const wsUrl = 'ws://localhost:4000';

  const client1 = new WebSocket(wsUrl);
  const client2 = new WebSocket(wsUrl);

  let client2ReceivedCursor = false;

  await new Promise((resolve, reject) => {
    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) resolve(true);
    };

    client1.on('open', checkConnected);
    client2.on('open', checkConnected);
    client1.on('error', reject);
    client2.on('error', reject);
  });

  console.log('[PASS] Connected 2 WebSocket collaboration clients');

  // Client 2 listens for cursor broadcast
  client2.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'cursor' && msg.userId === 'user_1') {
        client2ReceivedCursor = true;
      }
    } catch (e) {}
  });

  // Client 1 & 2 join the same document room
  client1.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_1' }));
  client2.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_2' }));

  await new Promise((r) => setTimeout(r, 200));

  // Client 1 broadcasts cursor move
  client1.send(JSON.stringify({
    type: 'cursor',
    userId: 'user_1',
    userName: 'Designer A',
    position: { x: 450, y: 320 },
  }));

  await new Promise((r) => setTimeout(r, 300));

  client1.close();
  client2.close();

  if (client2ReceivedCursor) {
    console.log('[PASS] Real-time collaboration cursor broadcast verified');
    console.log('\n========================================');
    console.log('WebSocket Collaboration: 100% SUCCESS');
    console.log('========================================\n');
    process.exit(0);
  } else {
    console.error('[FAIL] Client 2 did not receive cursor update');
    process.exit(1);
  }
}

testWebSocket();
