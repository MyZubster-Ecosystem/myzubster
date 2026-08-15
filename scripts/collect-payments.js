const { execSync } = require('child_process');
const fs = require('fs');

// Repository da controllare
const repos = [
  { name: 'myzubster', path: '../myzubster' },
  { name: 'my-monero-bounty', path: '../my-monero-bounty' },
  { name: 'MyZubsterGateway', path: '../MyZubsterGateway' },
  { name: 'tokenization-singapore', path: '../tokenization-singapore' },
  { name: 'MyZubsterWeb', path: '../MyZubsterWeb' }
];

// Cerca bounty nelle issue
function findBounties() {
  const payments = [];
  
  repos.forEach(repo => {
    try {
      // Cerca issue con bounty
      const issues = execSync(
        `cd ${repo.path} && gh issue list --json number,title,labels,comments --limit 50`,
        { encoding: 'utf8' }
      );
      
      const data = JSON.parse(issues);
      data.forEach(issue => {
        const hasBounty = issue.labels.some(l => 
          l.name.includes('bounty') || l.name.includes('💰')
        );
        
        if (hasBounty) {
          payments.push({
            repo: repo.name,
            issue: issue.number,
            title: issue.title,
            labels: issue.labels.map(l => l.name)
          });
        }
      });
    } catch (error) {
      console.error(`Errore per ${repo.name}:`, error.message);
    }
  });
  
  return payments;
}

const bounties = findBounties();
console.log(JSON.stringify(bounties, null, 2));
