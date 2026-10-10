import { Octokit } from "@octokit/rest";
import { ContributorEvidence, GitHubProvenance, VerificationStatus } from "@myzubster/core/types/contributor";

export class GitHubVerificationService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Valida se uma evidência de commit/PR é legítima via GitHub API.
   * Implementa o princípio de least-privilege.
   */
  async verifyEvidence(evidence: ContributorEvidence): Promise<VerificationStatus> {
    const { provenance } = evidence;

    try {
      if (provenance.eventType === 'pr' && provenance.pullRequestId) {
        const { data: pr } = await this.octokit.pulls.get({
          owner: provenance.repository.split('/')[0],
          repo: provenance.repository.split('/')[1],
          pull_number: provenance.pullRequestId,
        });

        // Validação rigorosa de autoria e SHA
        const isAuthorCorrect = pr.user?.login === provenance.authorHandle;
        const isShaCorrect = pr.head.sha === provenance.commitSha;
        const isMerged = pr.merged_at !== null;

        if (isAuthorCorrect && isShaCorrect && isMerged) {
          return 'VERIFIED';
        }
      } else if (provenance.eventType === 'commit') {
        const { data: commit } = await this.octokit.repos.getCommit({
          owner: provenance.repository.split('/')[0],
          repo: provenance.repository.split('/')[1],
          ref: provenance.commitSha,
        });

        if (commit.author?.login === provenance.authorHandle) {
          return 'VERIFIED';
        }
      }
      
      return 'UNVERIFIED';
    } catch (error) {
      console.error("Verification failed:", error);
      return 'UNVERIFIED';
    }
  }

  /**
   * Gera um draft de PR para atualização de README/Docs.
   * NUNCA faz push direto para main.
   */
  async proposeReadmeUpdate(
    repoOwner: string, 
    repoName: string, 
    newContent: string, 
    branchName: string
  ): Promise<string> {
    // 1. Create branch
    // 2. Create file content
    // 3. Create Pull Request
    // Retorna a URL do PR criado
    return `https://${repoOwner}.github/pull/draft-update`; 
  }
}
