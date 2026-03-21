import { Octokit } from "@octokit/rest";

/**
 * Verify that a PAT has write access to a given repo.
 */
export async function verifyGitHubAccess(repo: string, pat: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return { ok: false, error: "Invalid repo format. Use owner/repo-name." };
    }

    const octokit = new Octokit({ auth: pat });
    const { data } = await octokit.repos.get({ owner, repo: repoName });

    if (!data.permissions?.push) {
      return { ok: false, error: "PAT does not have write access to this repo." };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * Push a set of files to a GitHub repo as a single commit.
 */
export async function pushToGitHub(opts: {
  repo: string;
  pat: string;
  files: Map<string, string>;
  commitMessage: string;
}): Promise<void> {
  const [owner, repo] = opts.repo.split("/");
  const octokit = new Octokit({ auth: opts.pat });

  // Get the default branch's latest commit SHA
  let latestCommitSha: string;
  let baseTree: string;

  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    baseTree = commit.tree.sha;
  } catch {
    // If main doesn't exist, try master
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/master" });
    latestCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    baseTree = commit.tree.sha;
  }

  // Create blobs for all files
  const blobs = await Promise.all(
    Array.from(opts.files).map(async ([path, content]) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      });
      return { path, sha: data.sha };
    })
  );

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTree,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  });

  // Create commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: opts.commitMessage,
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // Update ref — try main first, fallback to master
  try {
    await octokit.git.updateRef({ owner, repo, ref: "heads/main", sha: newCommit.sha });
  } catch {
    await octokit.git.updateRef({ owner, repo, ref: "heads/master", sha: newCommit.sha });
  }
}
