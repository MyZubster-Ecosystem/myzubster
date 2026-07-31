/**
 * Storico pagamenti MyZubster
 * Dati aggregati da tutte le issue bounty
 */

const paymentHistory = {
  // Pagamenti completati
  completed: [
    {
      issue: '#65',
      repo: 'myzubster',
      bounty: 0.15,
      contributor: '@SourceProofLabs',
      txid: 'f491340d66d7789665da7846b17787e337ca464bad3489f30afe348986a1661e',
      date: '2026-07-31',
      address: '4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc'
    },
    {
      issue: '#23',
      repo: 'tokenization-singapore',
      bounty: 0.001,
      contributor: '@SourceProofLabs',
      txid: '7058ecdc253b63cdc9afe434ed1452566cecdfc18e0bd81b20b7472265aa20ec',
      date: '2026-07-31',
      address: '4B3v5k44b8pQTzqfAdxDCgZD8MZBVsX3qGDHGE5T94ZccEgv49nauhg7BzJj8dNBwAikguvTYqW5QRGDb7xSuEDVH4EfXAc'
    }
  ],
  
  // In attesa di pagamento
  pending: [
    {
      issue: '#23/#5',
      repo: 'my-monero-bounty',
      bounty: 0.06,
      contributor: '@jdjioe5-cpu',
      address: '46o6gz4Pzn8edEsjgL15jkRzPEakEYefGPoM6nbDqmegDL2GrHxtUonLbKKB7vQEhoWdaAqbNG26She7kaPmkBrxU5ofG8x',
      status: 'PR mergiata, in attesa pagamento'
    },
    {
      issue: '#60',
      repo: 'MyZubsterGateway',
      bounty: 0.10,
      contributor: '@leanworld7-netizen',
      address: '47T3uyXCwZi3warzatwN8d4d886whkvJTPS1yDbwj7NBZNVxfEBM27D4uTmMCJyWNbHmJ4qfg1XgpUDPxnb1Fi1YFj9tXPJ',
      status: 'PR mergiata, in attesa pagamento'
    },
    {
      issue: '#62',
      repo: 'MyZubsterGateway',
      bounty: 0.15,
      contributor: '@leanworld7-netizen',
      address: '47T3uyXCwZi3warzatwN8d4d886whkvJTPS1yDbwj7NBZNVxfEBM27D4uTmMCJyWNbHmJ4qfg1XgpUDPxnb1Fi1YFj9tXPJ',
      status: 'PR mergiata, in attesa pagamento'
    }
  ],
  
  // In review
  review: [
    {
      issue: '#63',
      repo: 'myzubster',
      bounty: 0.08,
      contributor: '@Aming9303',
      address: '45ynVR1NgjmJjPeGEvzPEg8s5rYJZkwQn8C5hzX2Tt8EC9s11VHemuZ3NQA59unUWTiTudyoNxvvQVLodMVthSZiNk5Xsk8',
      status: 'PR #106 in review'
    }
  ]
};

module.exports = paymentHistory;
