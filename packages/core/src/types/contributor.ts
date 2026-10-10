export type ContributionStatus = 
  | 'PROPOSED' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'TESTED' 
  | 'MERGED' 
  | 'SETTLED';

export type VerificationStatus = 'CLAIMED' | 'VERIFIED' | 'UNVERIFIED';

export interface GitHubProvenance {
  repository: string;
  commitSha: string;
  pullRequestId?: number;
  authorHandle: string;
  eventType: 'commit' | 'pr' | 'issue';
  timestamp: string;
  verificationMethod: 'github_api_v3' | 'manual_review';
}

export interface ContributorEvidence {
  id: string;
  status: ContributionStatus;
  verification: VerificationStatus;
  provenance: GitHubProvenance;
  skills: string[];
  metadata: Record<string, any>;
  idempotencyKey: string; // repo + PR/commit SHA + event
}

export interface ContributorPassport {
  address: string;
  githubHandle: string;
  verifiedContributions: ContributorEvidence[];
  claimedContributions: ContributorEvidence[];
  skillsGraph: string[];
  consentGiven: boolean;
}
