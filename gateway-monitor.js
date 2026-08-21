const { exec } = require('child_process');
const fs = require('fs');

const ORG = "MyZubster-Ecosystem";
const REPOS = [
  "MyZubster-Marketplace",
  "myzubster",
  "MyZubsterGateway",
  "myzubster-docs",
  "ai-automation",
  "MyZubster-App",
  "myzubster-animals",
  "myzubster-ai-bot"
];

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore: ${error.message}`);
        resolve("0");
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function checkGitHubStatus() {
  let report = `📊 **MyZubster Ecosystem Status Report**\n`;
  report += `📅 ${new Date().toLocaleString()}\n\n`;

  let totalIssues = 0;
  let totalPRs = 0;
  let mergablePRs = 0;
  let pendingBounties = 0;
  let pendingAmount = 0;
  let bountyDetails = [];
  let unassignedClaims = [];

  const today = new Date().toISOString().split('T')[0];

  for (const repo of REPOS) {
    const repoFull = `${ORG}/${repo}`;
    
    const issueCount = parseInt(await runCommand(`gh issue list -R ${repoFull} --state open --limit 1000 | wc -l`)) || 0;
    totalIssues += issueCount;

    const prCount = parseInt(await runCommand(`gh pr list -R ${repoFull} --state open --limit 1000 | wc -l`)) || 0;
    totalPRs += prCount;

    const mergableCount = parseInt(await runCommand(`gh pr list -R ${repoFull} --state open --limit 1000 --json isDraft | grep -c '"isDraft":false' || echo "0"`)) || 0;
    mergablePRs += mergableCount;

    if (issueCount > 0 || prCount > 0) {
      report += `\n📂 **${repo}**\n`;
      if (issueCount > 0) report += `   - Issues: ${issueCount}\n`;
      if (prCount > 0) report += `   - PRs: ${prCount} (${mergableCount} ready to merge)\n`;
    }

    // 🔍 Trova issue non assegnate con commenti di richiesta (usa jq per la compattezza)
    const claimCheckCmd = `gh issue list -R ${repoFull} --state open --assignee none --limit 50 --json number,title,url | jq -r '.[] | "\(.number)|\(.title)|\(.url)"'`;
    const unassignedOutput = await runCommand(claimCheckCmd);
    
    if (unassignedOutput && unassignedOutput !== "0") {
      const lines = unassignedOutput.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const [num, title, url] = line.split('|');
          const commentsCheck = await runCommand(`gh api -X GET repos/${repoFull}/issues/${num}/comments --jq '.[] | select(.body | contains("claim") or contains("I would like") or contains("I'd like to")) | .body' | head -c 100`);
          if (commentsCheck && commentsCheck.trim() !== "") {
            unassignedClaims.push({
              repo: repo,
              issue: `#${num}`,
              title: title,
              url: url,
              comment_preview: commentsCheck.substring(0, 50) + '...'
            });
          }
        }
      }
    }
  }

  // 📅 ISSUE aggiornate OGGI (parsing JSON diretto in Node.js)
  report += `\n📅 **Recent Activity (Today - ${today}):**\n`;
  let foundActivityToday = false;

  for (const repo of REPOS) {
    const repoFull = `${ORG}/${repo}`;
    
    // Cerca issue aggiornate oggi
    const todayIssuesCmd = `gh search issues --state=open --repo=${repoFull} --updated=">=${today}" --json title,number,url`;
    const todayIssuesJson = await runCommand(todayIssuesCmd);
    if (todayIssuesJson && todayIssuesJson.trim() !== "" && todayIssuesJson !== "[]") {
      try {
        const issues = JSON.parse(todayIssuesJson);
        if (issues && issues.length > 0) {
          report += `\n📂 **${repo} (Updated Issues Today):**\n`;
          for (const issue of issues) {
            report += `   - Issue #${issue.number}: ${issue.title} (${issue.url})\n`;
          }
          foundActivityToday = true;
        }
      } catch (e) {
        // Ignora errori di parsing
      }
    }

    // Cerca PR aperte oggi
    const todayPRsCmd = `gh search prs --state=open --repo=${repoFull} --created=">=${today}" --json title,number,url`;
    const todayPRsJson = await runCommand(todayPRsCmd);
    if (todayPRsJson && todayPRsJson.trim() !== "" && todayPRsJson !== "[]") {
      try {
        const prs = JSON.parse(todayPRsJson);
        if (prs && prs.length > 0) {
          report += `\n📂 **${repo} (New PRs Today):**\n`;
          for (const pr of prs) {
            report += `   - PR #${pr.number}: ${pr.title} (${pr.url})\n`;
          }
          foundActivityToday = true;
        }
      } catch (e) {
        // Ignora errori di parsing
      }
    }
  }

  if (!foundActivityToday) {
    report += `   - No new activity found across the ecosystem today.\n`;
  }

  // Leggi i bounty in sospeso
  try {
    const contributors = fs.readFileSync('/root/myzubster/CONTRIBUTORS.md', 'utf8');
    const pendingMatches = contributors.match(/⏳ Pending Payments.*?(?=\n##|$)/s);
    if (pendingMatches) {
      const lines = pendingMatches[0].split('\n');
      for (const line of lines) {
        if (line.includes('XMR')) {
          pendingBounties++;
          const amountMatch = line.match(/(\d+\.\d+)\s+XMR/);
          if (amountMatch) {
            pendingAmount += parseFloat(amountMatch[1]);
            const contributorMatch = line.match(/@([A-Za-z0-9_-]+)/);
            const addressMatch = line.match(/[A-Za-z0-9]{95,}/);
            bountyDetails.push({
              contributor: contributorMatch ? contributorMatch[1] : 'Unknown',
              amount: amountMatch[1],
              address: addressMatch ? addressMatch[0] : 'Not provided'
            });
          }
        }
      }
    }
  } catch (err) {
    report += `\n⚠️  Could not read CONTRIBUTORS.md\n`;
  }

  report += `\n📈 **Totals:**\n`;
  report += `   - Total Issues: ${totalIssues}\n`;
  report += `   - Total PRs: ${totalPRs}\n`;
  report += `   - PRs Ready to Merge: ${mergablePRs}\n`;
  report += `   - Pending Bounties: ${pendingBounties} issues\n`;
  report += `   - Total Pending XMR: ${pendingAmount.toFixed(3)} XMR\n`;

  if (bountyDetails.length > 0) {
    report += `\n🔗 **Pending Bounty Details:**\n`;
    for (const b of bountyDetails) {
      report += `   - @${b.contributor} → ${b.amount} XMR | Address: ${b.address}\n`;
    }
  }

  if (unassignedClaims.length > 0) {
    report += `\n🆕 **Unassigned Issues with Claim Requests (ACTION NEEDED):**\n`;
    for (const c of unassignedClaims) {
      report += `   - ${c.repo} ${c.issue}: ${c.title} (${c.url})\n`;
      report += `     → Preview: "${c.comment_preview}"\n`;
    }
  }

  fs.writeFileSync('gateway_report.txt', report);
  console.log(report);
}

checkGitHubStatus();
# bounty-fix-ref: https://github.com/MyZubster-Ecosystem/myzubster/issues/526
# bounty-fix-ref: https://github.com/MyZubster-Ecosystem/myzubster/issues/526
# bounty-fix-ref: https://github.com/MyZubster-Ecosystem/myzubster/issues/526
# bounty-fix-ref: https://github.com/MyZubster-Ecosystem/myzubster/issues/526
# bounty-fix-ref: https://github.com/MyZubster-Ecosystem/myzubster/issues/526
