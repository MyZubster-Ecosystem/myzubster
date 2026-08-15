const { processCommand } = require('./bot');
const readline = require('readline');

// Interfaccia per input manuale (per testing)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 MyZubster Payment Bot');
console.log('📋 Comandi disponibili:');
console.log('  /register <address> <issueId> <bounty>');
console.log('  /pay <issueId> <bounty> <contributor> <txid> <address>');
console.log('  /status');
console.log('  /history');
console.log('  /confirm <txid>');
console.log('  exit - per uscire');
console.log('');

rl.on('line', (input) => {
  if (input === 'exit') {
    console.log('👋 Arrivederci!');
    rl.close();
    return;
  }
  
  const response = processCommand(input);
  console.log('\n' + response + '\n');
});
