import WebSocket from 'ws';

async function testReconnectionAndSimultaneousEdits() {
  console.log('Testing WebSocket simultaneous edits & reconnection recovery...');
  const wsUrl = 'ws://localhost:4000';

  // 1. Simultaneous edits: Client 1 and Client 2 edit different nodes simultaneously
  const client1 = new WebSocket(wsUrl);
  const client2 = new WebSocket(wsUrl);

  await new Promise((resolve) => {
    let openCount = 0;
    const check = () => { if (++openCount === 2) resolve(true); };
    client1.on('open', check);
    client2.on('open', check);
  });

  client1.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_1' }));
  client2.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_2' }));
  await new Promise((r) => setTimeout(r, 200));

  let c1GotC2 = false;
  let c2GotC1 = false;

  client1.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'doc_change' && msg.userId === 'user_2') c1GotC2 = true;
  });

  client2.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'doc_change' && msg.userId === 'user_1') c2GotC1 = true;
  });

  // Simultaneous broadcasts
  client1.send(JSON.stringify({ type: 'doc_change', documentId: 'demo-doc', userId: 'user_1', nodeId: 'rect_1' }));
  client2.send(JSON.stringify({ type: 'doc_change', documentId: 'demo-doc', userId: 'user_2', nodeId: 'rect_2' }));

  await new Promise((r) => setTimeout(r, 400));
  if (!c1GotC2 || !c2GotC1) {
    throw new Error('Simultaneous broadcast exchange failed');
  }
  console.log('[PASS] Simultaneous edits across peer sessions verified');

  // 2. Reconnection test: Disconnect Client 1 and Reconnect
  client1.close();
  await new Promise((r) => setTimeout(r, 200));

  const client1Reconnected = new WebSocket(wsUrl);
  let rejoined = false;
  client1Reconnected.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'joined') rejoined = true;
  });

  await new Promise((resolve) => client1Reconnected.on('open', resolve));
  client1Reconnected.send(JSON.stringify({ type: 'join', documentId: 'demo-doc', userId: 'user_1' }));

  await new Promise((r) => setTimeout(r, 300));
  client1Reconnected.close();
  client2.close();

  if (!rejoined) throw new Error('Reconnection join acknowledgment failed');
  console.log('[PASS] WebSocket client reconnection recovery verified');
  console.log('\n========================================');
  console.log('Simultaneous Edits & Reconnection: 100% SUCCESS');
  console.log('========================================\n');
}

testReconnectionAndSimultaneousEdits().catch((e) => {
  console.error(e);
  process.exit(1);
});
